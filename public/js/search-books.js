// Function to search books
function searchBooks() {
    const query = document.getElementById('searchInput').value.trim();

    // Handling empty search string
    if (!query) {
        alert('Empty or whitespace search term is not allowed');
        return; // Exit function if the search term is empty
    }

    // Limit query length to 100 characters
    if (query.length > 100) {
        alert('Search term is too long. Please limit to 100 characters.');
        return; // Exit function if the query exceeds 100 characters
    }

    // Check for special characters in the query (only allow alphanumeric and space)
    const specialCharacterRegex = /[^a-zA-Z0-9\s]/; // Regular expression to check for non-alphanumeric characters
    if (specialCharacterRegex.test(query)) {
        alert('Search term contains special characters. Only alphanumeric characters and spaces are allowed.');
        return; // Exit function if special characters are found
    }

    // Create an XMLHttpRequest to fetch the search results from the backend
    const request = new XMLHttpRequest();
    document.getElementById('loading').style.display = 'block'; // Show loading indicator

    // Open a GET request with the query as a URL parameter
    request.open('GET', `http://localhost:5500/search?query=${encodeURIComponent(query)}`, true);

    // Define the onload event handler for the request
    request.onload = function () {
        document.getElementById('loading').style.display = 'none'; // Hide loading indicator

        // Check if the request was successful (status code between 200 and 299)
        if (request.status >= 200 && request.status < 300) {
            // Parse the JSON response to get the filtered books array
            const filteredBooks = JSON.parse(request.responseText);
            displayBooks(filteredBooks);
            

        } 
        
        // Handle no books found (status 404)

        else if (request.status === 404) {
            clearSearch()
            alert('No books found matching your search criteria.');
        }
    };
    request.send();
};

function toggleClearButton() {
    const searchInput = document.getElementById('searchInput');
    const clearButton = document.getElementById('clearSearchBtn');
    clearButton.style.display = searchInput.value.trim() ? 'inline' : 'none';
};

function clearSearch() {
    document.getElementById('searchInput').value = '';
    toggleClearButton();
    getBooks();}