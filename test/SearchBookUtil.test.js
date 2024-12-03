const { describe, it } = require('mocha');
const { assert } = require('chai'); // Use assert for assertions
const { app, server } = require('../index');
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const sinon = require('sinon');
const mongoose = require('mongoose'); // Import mongoose for MongoDB interaction

let baseUrl;
describe('Resource API', () => {
    before(async () => {
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

    after(async () => {
        await new Promise((resolve) => {
            server.close(() => resolve());
        });

        if (mongoose.connection.readyState) {
            await mongoose.connection.close();
        }
    });

    describe('GET /search', () => {
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
            chai.request(baseUrl)
                .get('/search?query=the')
                .end((err, res) => {
                    assert.strictEqual(res.status, 200, 'Status should be 200');
                    assert.isArray(res.body, 'Response body should be an array');
                    assert.isNotEmpty(res.body, 'Response body array should not be empty');
                    done();
                });
        });

        it('should return 404 if no books match the search query', (done) => {
            chai.request(baseUrl)
                .get('/search?query=nonexistentbooktitle')
                .end((err, res) => {
                    assert.strictEqual(res.status, 404, 'Status should be 404');
                    assert.strictEqual(
                        res.body.message,
                        'No books found matching your search.',
                        'Error message should match'
                    );
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
    });

    describe('Resource API with MongoDB - Server Error Cases', () => {
        let sandbox;

        beforeEach(() => {
            sandbox = sinon.createSandbox();
        });

        afterEach(() => {
            if (sandbox) {
                sandbox.restore();
            }
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
});
