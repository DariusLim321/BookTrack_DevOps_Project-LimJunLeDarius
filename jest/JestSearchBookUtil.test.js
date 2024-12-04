const request = require('supertest'); // Import Supertest
const { app, server } = require('../index'); // Import app and server
const mongoose = require('mongoose'); // For MongoDB interaction
const sinon = require('sinon'); // For mocking
const bookCollection = require('../models/book'); // Mocked MongoDB collection

let baseUrl;
let sandbox;

describe('BookTrack Search API ', () => {
  beforeAll(async () => {
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

  afterAll(async () => {
    // Close the server
    await new Promise((resolve) => {
      server.close(() => resolve());
    });

    // Close MongoDB connection
    if (mongoose.connection.readyState) {
      await mongoose.connection.close();
    }
  });

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    if (sandbox) {
      sandbox.restore();
    }
  });

  describe('GET /search', () => {
    test('should return 400 if the query parameter is missing', async () => {
      sandbox.stub(bookCollection, 'find').resolves([]); // Stub for safety
      const res = await request(app).get('/search');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid parameter: "query" is required and must be a non-empty string.');
    });

    test('should return 400 if the query is an empty string', async () => {
      sandbox.stub(bookCollection, 'find').resolves([]); // Stub for safety
      const res = await request(app).get('/search?query=');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid parameter: "query" is required and must be a non-empty string.');
    });

    test('should return 400 if the query is too long', async () => {
      sandbox.stub(bookCollection, 'find').resolves([]); // Stub for safety
      const longQuery = 'a'.repeat(101); // 101 characters long
      const res = await request(app).get(`/search?query=${longQuery}`);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Query is too long. Max length is 100 characters.');
    });

    test('should return 200 and matching books', async () => {
      sandbox.stub(bookCollection, 'find').resolves([
        { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald' },
        { title: 'The Catcher in the Rye', author: 'J.D. Salinger' },
      ]); // Stub for matching books

      const res = await request(app).get('/search?query=the');
      expect(res.status).toBe(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBeGreaterThan(0);
    });

    test('should return 404 if no books match the search query', async () => {
      sandbox.stub(bookCollection, 'find').resolves([]); // Stub no results
      const res = await request(app).get('/search?query=nonexistentbooktitle');
      expect(res.status).toBe(404);
      expect(res.body.message).toBe('No books found matching your search.');
    });

    test('should return 400 if the query contains special characters', async () => {
      sandbox.stub(bookCollection, 'find').resolves([]); // Stub for safety
      const res = await request(app).get('/search?query=book$%^');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Query contains special characters. Only alphanumeric characters and spaces are allowed.');
    });
  });
  test('should return 400 if the query is only whitespace', async () => {
    sandbox.stub(bookCollection, 'find').resolves([]); // Stub for safety
    const res = await request(app).get('/search?query=   '); // Query with only whitespace
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid parameter: "query" is required and must be a non-empty string.');
  });
  

  describe('Resource API with MongoDB - Server Error Cases', () => {
    test('should return 500 if there is a MongoDB query error', async () => {
      sandbox.stub(bookCollection, 'find').throws(new Error('MongoDB query failed'));

      const res = await request(app).get('/search?query=test');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Internal Server Error');
    });

    test('should return 500 if an unexpected error occurs during a MongoDB operation', async () => {
      sandbox.stub(bookCollection, 'find').throws(new Error('Unexpected server error'));

      const res = await request(app).get('/search?query=The');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Internal Server Error');
    });
  });
});
