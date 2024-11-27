// Cypress Tests
describe('BookTrack Frontend', () => {
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

  // Test the visibility and functionality of search elements
  it('should display the search input and button', () => {
    cy.visit(baseUrl);
    cy.get('#searchInput').should('be.visible'); // Check if the search input is visible
    cy.get('#searchButton').should('be.visible').and('contain.text', 'Search'); // Check if the search button is visible
  });

  // Test typing in the search input
  it('should allow typing in the search input', () => {
    cy.visit(baseUrl);
    cy.get('#searchInput').click();
    cy.get('#searchInput').type('the', { force: true });
  });

  // Test clearing the search input using the clear button
  it('should display the clear button after typing and clear the input on click', () => {
    cy.visit(baseUrl);
    const searchTerm = 'the';
    cy.get('#searchInput').type(searchTerm); // Type a search term
    cy.get('#clearSearchBtn').should('be.visible'); // Check if the clear button is visible
    cy.get('#clearSearchBtn').click(); // Click the clear button
    cy.get('#searchInput').should('have.value', ''); // Verify the input field is cleared
  });

  // Test the search functionality
  it('should fetch and display results based on the search term', () => {
    cy.visit(baseUrl);
    const searchTerm = 'the';
    cy.get('#searchInput').type(searchTerm); // Type the search term
    cy.get('#searchButton').click(); // Click the search button

    // Simulate loading and check if the books are displayed
    cy.wait(2000); // Wait for the simulated loading time (adjust as necessary for your app)

    // Verify the results
    cy.get('#bookContainer')
      .children()
      .should('exist')
  });

  // Test for no results
  it('should display a "no results" message if no books match the search term', () => {
    cy.visit(baseUrl);
    const invalidSearchTerm = 'InvalidBookName';
    cy.get('#searchInput').type(invalidSearchTerm); // Type an invalid search term
    cy.get('#searchButton').click(); // Click the search button
  
    // Wait for the alert to appear (adjust the wait time if necessary)
    cy.wait(2000); // Wait for the simulated loading time (adjust as necessary for your app)

    // Capture the alert and verify its content
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
  
});