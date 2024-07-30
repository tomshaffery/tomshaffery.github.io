document.getElementById('bookForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const title = document.getElementById('title').value;
    const author = document.getElementById('author').value;
    const publisher = document.getElementById('publisher').value;
    const subject = document.getElementById('subject').value;
    const isbn = document.getElementById('isbn').value;

    const params = { title, author, publisher, subject, isbn };
    console.log('Form submitted with params:', params); // Debug log
    const books = await fetchBookData(params);
    console.log('Books fetched:', books); // Debug log
    displayResults(books);
});

async function fetchBookData(params) {
    let query = '';
    if (params.title) query += `intitle:${encodeURIComponent(params.title)} `;
    if (params.author) query += `inauthor:${encodeURIComponent(params.author)} `;
    if (params.publisher) query += `inpublisher:${encodeURIComponent(params.publisher)} `;
    if (params.subject) query += `subject:${encodeURIComponent(params.subject)} `;
    if (params.isbn) query += `isbn:${encodeURIComponent(params.isbn)}`;

    console.log('Query:', query.trim()); // Debug log
    const response = await fetch(`/search_books?query=${query.trim()}`);
    const data = await response.json();
    return data.items || [];
}

function displayResults(books) {
    const results = document.getElementById('results');
    results.innerHTML = '';
    books.forEach(book => {
        const bookElement = document.createElement('div');
        bookElement.className = 'book';
        bookElement.innerHTML = `
            <h2>${book.volumeInfo.title}</h2>
            <p>${book.volumeInfo.authors ? book.volumeInfo.authors.join(', ') : 'No authors available'}</p>
            <p>${book.volumeInfo.publisher || 'No publisher available'}</p>
        `;
        results.appendChild(bookElement);
    });
    console.log('Results displayed'); // Debug log
}
