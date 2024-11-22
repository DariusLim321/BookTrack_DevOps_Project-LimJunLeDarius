describe('BookTrack Frontend', () => {
  let baseUrl;

  before(() => {
    cy.task('startServer').then((url) => {
      baseUrl = url; // Store the base URL
      cy.visit(baseUrl);
    });
  });

  after(() => {
    return cy.task('stopServer'); // Stop the server after the report is done
  });

  describe('Search Books', () => {
    beforeEach(() => {
      cy.visit(baseUrl);
    });

    it('should display search results for valid input', () => {
      cy.get('#searchInput').type('the');
      cy.get('#searchButton').click();
      cy.get('#bookContainer').should('contain', 'the'); // Ensure 'the' is part of the results
    });

    it('should display no results for invalid input', () => {
      cy.get('#searchInput').type('Nonexistent Book');
      cy.get('#searchButton').click();
      cy.get('#bookContainer').should('contain', 'No results found'); // Validate error message for no results
    });

    it('should clear search results when Clear button is clicked', () => {
      cy.get('#searchInput').type('the');
      cy.get('#clearSearchBtn').click();
      cy.get('#searchInput').should('have.value', ''); // Validate input is cleared
      cy.get('#bookContainer').should('not.contain', 'the'); // Validate results are cleared
    });
  });
});
