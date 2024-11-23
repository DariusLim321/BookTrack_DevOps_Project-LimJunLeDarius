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
    return cy.task('stopServer'); // Stop the server after the tests are complete
  });

  // Test the visibility and functionality of search elements
  it('should display the search input and button', () => {
    cy.get('#searchInput').should('be.visible'); // Check if the search input is visible
    cy.get('#searchButton').should('be.visible').and('contain.text', 'Search'); // Check if the search button is visible
  });

  // Test typing in the search input
  it('should allow typing in the search input', () => {
    const searchTerm = 'Fiction';
    cy.get('#searchInput').type(searchTerm).should('have.value', searchTerm); // Type a search term and verify it
  });

  // Test clearing the search input using the clear button
  it('should display the clear button after typing and clear the input on click', () => {
    const searchTerm = 'Mystery';
    cy.get('#searchInput').type(searchTerm); // Type a search term
    cy.get('#clearSearchBtn').should('be.visible'); // Check if the clear button is visible
    cy.get('#clearSearchBtn').click(); // Click the clear button
    cy.get('#searchInput').should('have.value', ''); // Verify the input field is cleared
  });

  // Test the search functionality
  it('should fetch and display results based on the search term', () => {
    const searchTerm = 'Non-Fiction';
    cy.get('#searchInput').type(searchTerm); // Type the search term
    cy.get('#searchButton').click(); // Click the search button

    // Simulate loading and check if the books are displayed
    cy.get('#loading').should('be.visible'); // Check if the loading message is displayed
    cy.wait(2000); // Wait for the simulated loading time (adjust as necessary for your app)

    // Verify the results
    cy.get('#bookContainer')
      .children()
      .should('exist')
      .and('contain.text', searchTerm); // Verify the displayed results contain the search term
  });

  // Test for no results
  it('should display a "no results" message if no books match the search term', () => {
    const invalidSearchTerm = 'InvalidBookName';
    cy.get('#searchInput').type(invalidSearchTerm); // Type an invalid search term
    cy.get('#searchButton').click(); // Click the search button

    // Verify the "no results" message
    cy.get('#bookContainer').should('contain.text', 'No books found'); // Adjust this text based on your app's implementation
  });
});
