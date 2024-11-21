const { describe, it, before, after } = require('mocha');
const { expect } = require('chai');
const { app, server } = require('../index');
const chai = require('chai');
const chaiHttp = require('chai-http');

chai.use(chaiHttp);

let baseUrl;

describe('Resource API', function() {
    // Increase timeout for the entire test suite if necessary
    this.timeout(5000); // Set the timeout to 5 seconds

    before(async () => {
        const { address, port } = await server.address();
        baseUrl = `http://${address === '::' ? 'localhost' : address}:${port}`;
    });

    after(async () => {
        // Ensure the server closes only after all tests are completed
        await new Promise((resolve) => {
            server.close(() => {
                resolve();
            });
        });
    });

    describe('GET /search', function() {
        this.timeout(5000); // Optional: Increase timeout for the search tests individually

        // Test case for missing query parameter
        it('should return 400 if the query parameter is missing', (done) => {
            chai.request(baseUrl)
                .get('/search')
                .end((err, res) => {
                    expect(res).to.have.status(400);
                    expect(res.body.error).to.equal('Invalid parameter: "query" is required and must be a non-empty string.');
                    done();
                });
        });

        // Test case for empty query string
        it('should return 400 if the query is an empty string', (done) => {
            chai.request(baseUrl)
                .get('/search?query=') 
                .end((err, res) => {
                    expect(res).to.have.status(400);
                    expect(res.body.error).to.equal('Invalid parameter: "query" is required and must be a non-empty string.');
                    done();
                });
        });

        // Test case for query longer than 100 characters
        it('should return 400 if the query is too long', (done) => {
            const longQuery = 'a'.repeat(101); // 101 characters long
            chai.request(baseUrl)
                .get(`/search?query=${longQuery}`)
                .end((err, res) => {
                    expect(res).to.have.status(400);
                    expect(res.body.error).to.equal('Query is too long. Max length is 100 characters.');
                    done();
                });
        });

        // Test case for successful search with matching book title
        it('should return 200 and matching books', (done) => {
            const mockBook = { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald' };
            chai.request(baseUrl)
                .post('/add-resource') // Assuming /add-resource adds a book or resource to the database
                .send(mockBook)
                .end((err, res) => {
                    chai.request(baseUrl)
                        .get('/search?query=gatsby')
                        .end((err, res) => {
                            expect(res).to.have.status(200);
                            expect(res.body).to.be.an('array').that.is.not.empty;
                            expect(res.body[0].title).to.equal('The Great Gatsby');
                            done();
                        });
                });
        });

        // Test case for search that returns no results
        it('should return 404 if no books match the search query', (done) => {
            chai.request(baseUrl)
                .get('/search?query=nonexistentbooktitle')
                .end((err, res) => {
                    expect(res).to.have.status(404);
                    expect(res.body.message).to.equal('No books found matching your search.');
                    done();
                });
        });

        // Test case for valid search with different casing (case-insensitive search)
        it('should return 200 and matching books with case-insensitive search', (done) => {
            const mockBook = { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald' };
            chai.request(baseUrl)
                .post('/add-resource') // Assuming /add-resource adds a book or resource to the database
                .send(mockBook)
                .end((err, res) => {
                    chai.request(baseUrl)
                        .get('/search?query=THE GREAT gatsby')
                        .end((err, res) => {
                            expect(res).to.have.status(200);
                            expect(res.body).to.be.an('array').that.is.not.empty;
                            expect(res.body[0].title).to.equal('The Great Gatsby');
                            done();
                        });
                });
        });

        // Test case for a query containing special characters that require escaping
        it('should return 400 if the query contains special characters', (done) => {
            chai.request(baseUrl)
                .get('/search?query=book$%^')
                .end((err, res) => {
                    expect(res).to.have.status(400);
                    expect(res.body.error).to.equal('Query contains special characters. Only alphanumeric characters and spaces are allowed.');
                    done();
                });
        });
    });
});
