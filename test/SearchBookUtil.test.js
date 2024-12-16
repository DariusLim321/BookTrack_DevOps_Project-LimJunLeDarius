const { describe, it } = require('mocha');
const assert = require('assert'); // Use Node's assert module for assertions
const { app, server } = require('../index');
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const sinon = require('sinon');
const mongoose = require('mongoose');  // Import mongoose for MongoDB interaction

let baseUrl;
describe('BookTrack Search API', () => {
    let sandbox;

    before(async () => {
        // Connect to MongoDB (Stubbing for MongoDB interactions will be done for all test cases)
        try {
            await mongoose.connect(process.env.MONGODB_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
        } catch (err) {
            throw new Error('Error connecting to MongoDB: ' + err.message);
        }
    
        // Start the server
        const { address, port } = await server.address();
        baseUrl = `http://${address === '::' ? 'localhost' : address}:${port}`;
    });
    
    after(async () => {
        // Close the server
        await new Promise((resolve, reject) => {
            server.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    
        // Close MongoDB connection
        if (mongoose.connection.readyState) {
            await mongoose.connection.close();
        }
    });
    
    beforeEach(() => {
        sandbox = sinon.createSandbox();  // Create a new sandbox for each test case
    });
    
    afterEach(() => {
        if (sandbox) {
            sandbox.restore();  // Restore all stubs after each test case
        }
    });

    // Test case for query longer than 100 characters
    it('should return 400 if the query is too long', (done) => {
        const longQuery = 'a'.repeat(101); // 101 characters long
        chai.request(baseUrl)
            .get(`/search?query=${longQuery}`)
            .end((err, res) => {
                assert.strictEqual(res.status, 400);
                assert.strictEqual(res.body.error, 'Query is too long. Max length is 100 characters.');
                done();
            });
    });

    // Test case for missing query parameter
    it('should return 400 if the query parameter is missing', (done) => {
        chai.request(baseUrl)
            .get('/search')
            .end((err, res) => {
                assert.strictEqual(res.status, 400);
                assert.strictEqual(res.body.error, 'Invalid parameter: "query" is required and must be a non-empty string.');
                done();
            });
    });

    // Test case for empty query string
    it('should return 400 if the query is an empty string', (done) => {
        chai.request(baseUrl)
            .get('/search?query=')  // Empty query string
            .end((err, res) => {
                assert.strictEqual(res.status, 400);
                assert.strictEqual(res.body.error, 'Invalid parameter: "query" is required and must be a non-empty string.');
                done();
            });
    });

    // Test case for successful search with matching book title
    it('should return 200 and matching books', function(done) {
        // this.timeout(5000); // Increase timeout if needed

        // Stubbing the MongoDB query to return mock data
        const bookCollection = require('../models/book.js');
        const mockBooks = [{ title: 'The Great Gatsby' }, { title: 'The Theory of Everything' }];
        sandbox.stub(bookCollection, 'find').returns(Promise.resolve(mockBooks));  // Stub MongoDB find method

        chai.request(baseUrl)
            .get('/search?query=the')
            .end((err, res) => {
                if (err) {
                    console.error('Error searching for books:', err);
                    return done(err);
                }
                assert.strictEqual(res.status, 200);
                assert(Array.isArray(res.body));
                assert(res.body.length > 0);
                done();
            });
    });

    // Test case for search that returns no results
    it('should return 404 if no books match the search query', (done) => {
        // Stubbing the MongoDB query to return no results
        const bookCollection = require('../models/book.js');
        sandbox.stub(bookCollection, 'find').returns(Promise.resolve([]));  // Stub MongoDB find method to return empty array

        chai.request(baseUrl)
            .get('/search?query=nonexistentbooktitle')
            .end((err, res) => {
                assert.strictEqual(res.status, 404);
                assert.strictEqual(res.body.message, 'No books found matching your search.');
                done();
            });
    });

    // Test case for query containing special characters
    it('should return 400 if the query contains special characters', (done) => {
        chai.request(baseUrl)
            .get('/search?query=book$%^')
            .end((err, res) => {
                assert.strictEqual(res.status, 400);
                assert.strictEqual(res.body.error, 'Query contains special characters. Only alphanumeric characters and spaces are allowed.');
                done();
            });
    });

    // Test case for MongoDB query error
    it('should return 500 if there is a MongoDB query error', (done) => {
        const bookCollection = require('../models/book.js'); 
        sandbox.stub(bookCollection, 'find').throws(new Error('MongoDB query failed'));  // Stub to throw error during find operation

        chai.request(baseUrl)
            .get('/search?query=test') 
            .end((err, res) => {
                assert.strictEqual(res.status, 500);
                assert.strictEqual(res.body.error, 'Internal Server Error');
                done();
            });
    });

    
});
