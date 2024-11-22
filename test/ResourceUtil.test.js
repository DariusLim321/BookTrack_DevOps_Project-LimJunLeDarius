const { describe, it } = require('mocha');
const { expect } = require('chai');
const { app, server } = require('../index');
const chai = require('chai');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
const sinon = require('sinon');
const mongoose = require('mongoose');                     // Import mongoose for MongoDB interaction

let baseUrl;
let sandbox;
describe('Resource API', () => {
    before(async () => {
        // Connect to MongoDB
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

        // Start the server
        const { address, port } = await server.address();
        baseUrl = `http://${address === '::' ? 'localhost' : address}:${port}`;
    });

    after(async () => {
        // Close the server
        await new Promise((resolve) => {
            server.close(() => resolve());
        });

        // Drop and close MongoDB connection
        if (mongoose.connection.readyState) {
            // await mongoose.connection.db.dropDatabase();
            // console.log('Test database dropped.');
            await mongoose.connection.close();
        }
    });
    afterEach(() => {
        // Restore the sandbox after each test
        if (sandbox) {
            sandbox.restore();
        }
    });

    // Your test cases go here



    describe('GET /search', () => {

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
        it('should return 200 and matching books', function(done) {
            this.timeout(5000); // Increase timeout if needed
        
            chai.request(baseUrl)
                .get('/search?query=the')
                .end((err, res) => {
                    if (err) {
                        console.error('Error searching for books:', err);
                        return done(err);
                    }
        
                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('array').that.is.not.empty;
                    done();
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
        // it('should return 200 and matching books with case-insensitive search', (done) => {
        //     const mockBook = { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald' };
        //     chai.request(baseUrl)
        //         .post('/add-resource') // Assuming /add-resource adds a book or resource to the database
        //         .send(mockBook)
        //         .end((err, res) => {
        //             chai.request(baseUrl)
        //                 .get('/search?query=the')
        //                 .end((err, res) => {
        //                     expect(res).to.have.status(200);
        //                     expect(res.body).to.be.an('array').that.is.not.empty;
        //                     // expect(res.body[0].title).to.equal('The Great Gatsby');
        //                     done();
        //                 });
        //         });
        // });

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
    describe('Resource API with MongoDB - Server Error Cases', () => {
        before(async () => {
            const { address, port } = await server.address();
            baseUrl = `http://${address === '::' ? 'localhost' : address}:${port}`;
        });
    
        after(() => {
            return new Promise((resolve) => {
                server.close(() => {
                    resolve();
                });
            });
        });
    
        afterEach(() => {
            if (sandbox) {
                sandbox.restore();
            }
        });
    
        it('should return 500 if there is a MongoDB query error', (done) => {
            sandbox = sinon.createSandbox();
    
            // Mock MongoDB's `find` operation to simulate a query failure
            const bookCollection = require('../models/book.js'); // Replace with your actual MongoDB model or collection module
            sandbox.stub(bookCollection, 'find').throws(new Error('MongoDB query failed'));
    
            chai.request(baseUrl)
                .get('/search?query=test') // Replace with your actual route
                .end((err, res) => {
                    expect(res).to.have.status(500);
                    expect(res.body.error).to.equal('Internal Server Error');
                    done();
                });
        });
    
        // it('should return 500 if there is a MongoDB connection error', async () => {
        //     sandbox = sinon.createSandbox();
        
        //     // Set the MONGODB_URI for testing purposes if it's not already set
        //     process.env.MONGODB_URI = 'mongodb://localhost:27017/test'; // Use an invalid or unreachable URI for testing
        
        //     const mongoose = require('mongoose');
            
        //     // Mock mongoose.connect to simulate a connection error
        //     sandbox.stub(mongoose, 'connect').rejects(new Error('MongoDB connection error'));
        
        //     try {
        //         // Make a request to the search endpoint
        //         const res = await chai.request(baseUrl)
        //             .get('/search?query=the');  // Replace with your actual route
                
        //         // If the connection error is properly handled, the response should be a 500
        //         expect(res).to.have.status(500);
        //         expect(res.body.error).to.equal('Internal Server Error');
        //     } catch (err) {
        //         // Check for err.response if it's available
        //         if (err.response) {
        //             // If we have a response, we can check the error status and message
        //             expect(err.response).to.have.status(500);
        //             expect(err.response.body.error).to.equal('Internal Server Error');
        //         } else {
        //             // If no response object is available, this is a different type of error (likely before response)
        //             console.error('Error without response:', err); // Log error for better diagnostics
        //             throw new Error('Test failed due to no response object');
        //         }
        //     } finally {
        //         // Always restore the sandbox to clean up stubs and mocks
        //         sandbox.restore();
        //     }
        // });
        
        
        
        
    
        it('should return 500 if an unexpected error occurs during a MongoDB operation', (done) => {
            sandbox = sinon.createSandbox();
        
            const mockCollection = require('../models/book.js');
            sandbox.stub(mockCollection, 'find').throws(new Error('Unexpected server error'));
        
            chai.request(baseUrl)
                .get('/search?query=The')
                .end((err, res) => {
                    expect(res).to.have.status(500);  // Ensure this checks for status 500
                    expect(res.body.error).to.equal('Internal Server Error');
                    done();
                });
        });
        
    });
});
