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

describe('bookTrack Search API', () => {
    // Set up MongoDB and server connection before running the tests
    before(async () => {
        try {
            // Connect to MongoDB
            await mongoose.connect(process.env.MONGODB_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
            console.log('Connected to MongoDB');
        } catch (err) {
            console.error('Error connecting to MongoDB:', err);
            throw err;
        }

        // Initialize server URL
        try {
            const { address, port } = server.address();
            baseUrl = `http://${address === '::' ? 'localhost' : address}:${port}`;
        } catch (err) {
            console.error('Error initializing server:', err);
            throw err;
        }
    });

    // Cleanup after all tests
    after(async () => {
        console.log('Cleaning up after tests...');

        // Close server
        if (server && server.listening) {
            await new Promise((resolve) => server.close(resolve));
            console.log('Server closed.');
        }

        // Close MongoDB connection
        if (mongoose.connection.readyState) {
            try {
                await mongoose.connection.close();
                console.log('MongoDB connection closed.');
            } catch (err) {
                console.error('Error closing MongoDB connection:', err);
            }
        }

        console.log('Cleanup completed.');
    });

    // Set up Sinon sandbox before each test
    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    // Restore Sinon sandbox after each test
    afterEach(() => {
        if (sandbox) {
            sandbox.restore();
        }
    });

    // Test cases
    it('should return 400 if the query parameter is missing', async () => {
        const res = await chai.request(baseUrl).get('/search');
        assert.strictEqual(res.status, 400, 'Status should be 400');
        assert.strictEqual(
            res.body.error,
            'Invalid parameter: "query" is required and must be a non-empty string.',
            'Error message should match'
        );
    });

    it('should return 400 if the query is an empty string', async () => {
        const res = await chai.request(baseUrl).get('/search?query=');
        assert.strictEqual(res.status, 400, 'Status should be 400');
        assert.strictEqual(
            res.body.error,
            'Invalid parameter: "query" is required and must be a non-empty string.',
            'Error message should match'
        );
    });

    it('should return 400 if the query is too long', async () => {
        const longQuery = 'a'.repeat(101);
        const res = await chai.request(baseUrl).get(`/search?query=${longQuery}`);
        assert.strictEqual(res.status, 400, 'Status should be 400');
        assert.strictEqual(
            res.body.error,
            'Query is too long. Max length is 100 characters.',
            'Error message should match'
        );
    });

    it('should return 200 and matching books', async () => {
        // Stub the MongoDB query to return mock data
        const bookCollection = require('../models/book.js');
        const mockBooks = [{ title: 'The Great Gatsby' }, { title: 'The Theory of Everything' }];
        sandbox.stub(bookCollection, 'find').returns(Promise.resolve(mockBooks));

        const res = await chai.request(baseUrl).get('/search?query=the');
        assert.strictEqual(res.status, 200);
        assert(Array.isArray(res.body), 'Response should be an array');
        assert(res.body.length > 0, 'Response array should not be empty');
    });

    it('should return 404 if no books match the search query', async () => {
        // Stub the MongoDB query to return no results
        const bookCollection = require('../models/book.js');
        sandbox.stub(bookCollection, 'find').returns(Promise.resolve([]));

        const res = await chai.request(baseUrl).get('/search?query=nonexistentbooktitle');
        assert.strictEqual(res.status, 404);
        assert.strictEqual(res.body.message, 'No books found matching your search.');
    });

    it('should return 400 if the query contains special characters', async () => {
        const res = await chai.request(baseUrl).get('/search?query=book$%^');
        assert.strictEqual(res.status, 400, 'Status should be 400');
        assert.strictEqual(
            res.body.error,
            'Query contains special characters. Only alphanumeric characters and spaces are allowed.',
            'Error message should match'
        );
    });

    it('should return 500 if there is a MongoDB query error', async () => {
        const bookCollection = require('../models/book.js');
        sandbox.stub(bookCollection, 'find').throws(new Error('MongoDB query failed'));

        const res = await chai.request(baseUrl).get('/search?query=test');
        assert.strictEqual(res.status, 500, 'Status should be 500');
        assert.strictEqual(res.body.error, 'Internal Server Error', 'Error message should match');
    });

    it('should return 500 if an unexpected error occurs during a MongoDB operation', async () => {
        const bookCollection = require('../models/book.js');
        sandbox.stub(bookCollection, 'find').throws(new Error('Unexpected server error'));

        const res = await chai.request(baseUrl).get('/search?query=The');
        assert.strictEqual(res.status, 500, 'Status should be 500');
        assert.strictEqual(res.body.error, 'Internal Server Error', 'Error message should match');
    });
});
