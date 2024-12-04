// Cypress Tests
describe('Search Book Frontend', () => {
  let baseUrl;

  // Start the server before tests and set the base URL
  before(() => {
    cy.task('startServer').then((url) => {
      baseUrl = url; // Store the base URL
      cy.visit(baseUrl); // Visit the base URL
    });
  });

  // Stop the server after tests
  after(() => {
    cy.task('stopServer'); // Stop the server after the tests are complete
  });
  it('should fetch and display results based on the search term', () => {
    const searchTerm = 'the';
  
    // Mock data for the search results
    const mockResults = [
      { id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald' },
      { id: 2, title: 'The Catcher in the Rye', author: 'J.D. Salinger' },
    ];
  
    // Intercept the search request with the query parameter in the URL
    cy.intercept('GET', `http://localhost:5500/search*?query=${encodeURIComponent(searchTerm)}`, {
      statusCode: 200,
      body: mockResults,
    }).as('searchBooks');
  
    // Visit the app and perform the search
    cy.visit(baseUrl);
    cy.get('#searchInput').type(searchTerm); // Type the search term
    cy.get('#searchButton').click(); // Click the search button
  
    // Wait for the intercepted request to complete
    cy.wait('@searchBooks');
  
    // Verify the results are displayed
    cy.get('#bookContainer')
  .should('exist')
  .and('be.visible');  // Check if it's visible after the mock response is handled

  });
  // Test for no results
  it('should display a "no results" message if no books match the search term', () => {
    const invalidSearchTerm = 'InvalidBookName';
  
    // Intercept the search request and respond with a 404 status for no results
    cy.intercept('GET', `http://localhost:5500/search*?query=${encodeURIComponent(invalidSearchTerm)}`, {
      statusCode: 404, // Simulating a 404 error when no books are found
      body: { message: 'No books found matching your search criteria.' }, // Optional: Include a message in the body
    }).as('searchBooks');
  
    // Visit the app and perform the search
    cy.visit(baseUrl);
    cy.get('#searchInput').type(invalidSearchTerm); // Type an invalid search term
    cy.get('#searchButton').click(); // Click the search button
  
    // Wait for the intercepted request to complete
    cy.wait('@searchBooks');
  
    // Verify that the "no results" alert is shown
    cy.on('window:alert', (alertText) => {
      // Assert that the alert contains the "no results" message
      expect(alertText).to.equal('No books found matching your search criteria.');
    });
  });
  // Test for empty or whitespace search term
  it('should not allow an empty or whitespace-only search term', () => {
    cy.visit(baseUrl);
    cy.get('#searchInput').type('    '); // Type whitespace
    cy.get('#searchButton').click(); // Click the search button

    cy.on('window:alert', (alertText) => {
      expect(alertText).to.equal('Empty or whitespace search term is not allowed');
    });
  });

  // Test for search term exceeding 100 characters
  it('should display an error if the search term exceeds 100 characters', () => {
    cy.visit(baseUrl);
    const longSearchTerm = 'a'.repeat(101); // Create a string with 101 characters
    cy.get('#searchInput').type(longSearchTerm); // Type the long search term
    cy.get('#searchButton').click(); // Click the search button

    cy.on('window:alert', (alertText) => {
      expect(alertText).to.equal('Search term is too long. Please limit to 100 characters.');
    });
  });

  // Test for invalid search term with special characters
  it('should display an error if the search term contains special characters', () => {
    cy.visit(baseUrl);
    const invalidSearchTerm = 'Hello@World!';
    cy.get('#searchInput').type(invalidSearchTerm); // Type a term with special characters
    cy.get('#searchButton').click(); // Click the search button

    cy.on('window:alert', (alertText) => {
      expect(alertText).to.equal('Search term contains special characters. Only alphanumeric characters and spaces are allowed.');
    });
  });
  it('should display "Failed to retrieve search results. Please try again later." when an error occurs during the search', () => {
    const searchTerm = 'the'; // Example search term
  
    // Mock the XMLHttpRequest failure by intercepting the request and returning a failure status
    cy.intercept('GET', `http://localhost:5500/search*?query=${encodeURIComponent(searchTerm)}`, {
      statusCode: 500, // Simulate server error (500 Internal Server Error)
      body: { message: 'Internal server error' }, // Optional: Provide error message in the response body
    }).as('searchBooksError');
  
    // Visit the page and perform the search
    cy.visit(baseUrl);
    cy.get('#searchInput').type(searchTerm); // Type the search term
    cy.get('#searchButton').click(); // Click the search button
  
    // Wait for the intercepted request to complete
    cy.wait('@searchBooksError');
  
    // Verify the alert for the error message
    cy.on('window:alert', (alertText) => {
      expect(alertText).to.equal('Failed to retrieve search results. Please try again later.');
    });
  });
  it('should display the search input and button', () => {
    cy.visit(baseUrl);
    cy.get('#searchInput').should('be.visible'); // Check if the search input is visible
    cy.get('#searchButton').should('be.visible').and('contain.text', 'Search'); // Check if the search button is visible
  });
  it('should allow typing in the search input', () => {
    cy.visit(baseUrl);
    cy.get('#searchInput').click();
    cy.get('#searchInput').type('the', { force: true });
  });
  it('should display the clear button after typing and clear the input on click', () => {
    cy.visit(baseUrl);
    const searchTerm = 'the';
    cy.get('#searchInput').type(searchTerm); // Type a search term
    cy.get('#clearSearchBtn').should('be.visible'); // Check if the clear button is visible
    cy.get('#clearSearchBtn').click(); // Click the clear button
    cy.get('#searchInput').should('have.value', ''); // Verify the input field is cleared
  });
  it('should clear the search input if no results are found', () => {
    const invalidSearchTerm = 'InvalidBookName'; // A search term that will return no results
  
    // Intercept the search request and respond with a 404 status for no results
    cy.intercept('GET', `http://localhost:5500/search*?query=${encodeURIComponent(invalidSearchTerm)}`, {
      statusCode: 404, // Simulate 404 error when no results are found
      body: { message: 'No books found matching your search criteria.' }, // Optional: Include a message in the body
    }).as('searchBooks');
  
    // Visit the app and perform the search
    cy.visit(baseUrl);
    cy.get('#searchInput').type(invalidSearchTerm); // Type the invalid search term
    cy.get('#searchButton').click(); // Click the search button
  
    // Wait for the intercepted request to complete
    cy.wait('@searchBooks');
  
    // Verify the alert for no results
    cy.on('window:alert', (alertText) => {
      expect(alertText).to.equal('No books found matching your search criteria.');
    });
  
    // Verify that the search input is cleared
    cy.get('#searchInput').should('have.value', ''); // Check if the input field is cleared
  });

  it('should show the clear button when there is text in the search input', () => {
    cy.visit(baseUrl);
    cy.get('#searchInput').type('Book');
    cy.get('#clearSearchBtn').should('be.visible');
  });

  it('should hide the clear button when the search input is empty', () => {
    cy.visit(baseUrl);
    cy.get('#clearSearchBtn').should('not.be.visible');
    cy.get('#searchInput').type('Book').clear();
    cy.get('#clearSearchBtn').should('not.be.visible');
  });

  // Test the visibility and functionality of search elements
  

  // Test typing in the search input
  
  // Test clearing the search input using the clear button
  
  it('should clear the search input and hide the clear button when clearSearch is called', () => {
    cy.visit(baseUrl);
    cy.get('#searchInput').type('Book');
    cy.get('#clearSearchBtn').should('be.visible');
    cy.get('#clearSearchBtn').click();
    cy.get('#searchInput').should('have.value', '');
    cy.get('#clearSearchBtn').should('not.be.visible');
  });

  it('should hide the clear button when the input is empty or contains only spaces', () => {
    cy.visit(baseUrl);
    cy.get('#searchInput').clear(); // Clear any existing text
    cy.get('#clearSearchBtn').should('not.be.visible'); // Check if the clear button is hidden
  
    cy.get('#searchInput').type('     '); // Type spaces
    cy.get('#clearSearchBtn').should('not.be.visible'); // Check if the clear button is hidden
  });

  // Test the search functionality
  
  

  
  

  // Test that the search input is cleared automatically if no results are found
  
  


  

  
  
  
});