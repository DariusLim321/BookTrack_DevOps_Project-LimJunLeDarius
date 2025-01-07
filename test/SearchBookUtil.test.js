const { describe, it, before, after, beforeEach, afterEach } = require('mocha');
const { assert } = require('chai');
const { app, server } = require('../index');
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const sinon = require('sinon');
const mongoose = require('mongoose');
let baseUrl;
let sandbox;
 
describe('bookTrack Search API', function () {
    before(async function () {
        this.timeout(10000); // Increase timeout if necessary
        try {
            await mongoose.connect(process.env.MONGODB_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
            console.log('Connected to MongoDB');
        } catch (err) {
            console.error('Error connecting to MongoDB:', err);
            throw err;
        }
 
        const { address, port } = await server.address();
        baseUrl = `http://${address === '::' ? 'localhost' : address}:${port}`;
    });
 
    after(async function () {
        this.timeout(10000); // Increase timeout if necessary
 
        try {
            await new Promise((resolve, reject) => {
                server.close(err => {
                    if (err) reject(err);
                    resolve();
                });
            });
 
            if (mongoose.connection.readyState) {
                await mongoose.connection.close();
            }
        } catch (err) {
            console.error('Error during cleanup:', err);
            throw err;
        }
    });
 
    beforeEach(() => {
        sandbox = sinon.createSandbox();  // Initialize sandbox before each test
    });
 
    afterEach(() => {
        if (sandbox) {
            sandbox.restore();  // Restore sandbox after each test.
        }
    });
 
    it('should return 400 if the query parameter is missing', (done) => {
        chai.request(baseUrl)
            .get('/search')
            .end((err, res) => {
                assert.strictEqual(res.status, 400, 'Status should be 400');
                assert.strictEqual(
                    res.body.error,
                    'Invalid parameter: "query" is required and must be a non-empty string.',
                    'Error message should match'
                );
                done();
            });
    });
 
    it('should return 400 if the query is an empty string', (done) => {
        chai.request(baseUrl)
            .get('/search?query=')
            .end((err, res) => {
                assert.strictEqual(res.status, 400, 'Status should be 400');
                assert.strictEqual(
                    res.body.error,
                    'Invalid parameter: "query" is required and must be a non-empty string.',
                    'Error message should match'
                );
                done();
            });
    });
 
    it('should return 400 if the query is too long', (done) => {
        const longQuery = 'a'.repeat(101);
        chai.request(baseUrl)
            .get(`/search?query=${longQuery}`)
            .end((err, res) => {
                assert.strictEqual(res.status, 400, 'Status should be 400');
                assert.strictEqual(
                    res.body.error,
                    'Query is too long. Max length is 100 characters.',
                    'Error message should match'
                );
                done();
            });
    });
 
    it('should return 200 and matching books', function (done) {
        this.timeout(5000); // Increase timeout if needed
 
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
 
    it('should return 400 if the query contains special characters', (done) => {
        chai.request(baseUrl)
            .get('/search?query=book$%^')
            .end((err, res) => {
                assert.strictEqual(res.status, 400, 'Status should be 400');
                assert.strictEqual(
                    res.body.error,
                    'Query contains special characters. Only alphanumeric characters and spaces are allowed.',
                    'Error message should match'
                );
                done();
            });
    });
 
    it('should return 500 if there is a MongoDB query error', (done) => {
        const bookCollection = require('../models/book.js');
        sandbox.stub(bookCollection, 'find').throws(new Error('MongoDB query failed'));
 
        chai.request(baseUrl)
            .get('/search?query=test')
            .end((err, res) => {
                assert.strictEqual(res.status, 500, 'Status should be 500');
                assert.strictEqual(res.body.error, 'Internal Server Error', 'Error message should match');
                done();
            });
    });
 
    it('should return 500 if an unexpected error occurs during a MongoDB operation', (done) => {
        const mockCollection = require('../models/book.js');
        sandbox.stub(mockCollection, 'find').throws(new Error('Unexpected server error'));
 
        chai.request(baseUrl)
            .get('/search?query=The')
            .end((err, res) => {
                assert.strictEqual(res.status, 500, 'Status should be 500');
                assert.strictEqual(res.body.error, 'Internal Server Error', 'Error message should match');
                done();
            });
    });
});
