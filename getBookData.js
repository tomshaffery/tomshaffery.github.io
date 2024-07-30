document.getElementById('bookForm').addEventListener('submit', async function(event) {
    event.preventDefault();
    const title = document.getElementById('title').value;
    const author = document.getElementById('author').value;
    const publisher = document.getElementById('publisher').value;
    const subject = document.getElementById('subject').value;
    const isbn = document.getElementById('isbn').value;
});


async function fetchBookData(params) {
    let query = '';
    if (params.title) query += `intitle:${encodeURIComponent(params.title)} `;
    if (params.author) query += `inauthor:${encodeURIComponent(params.title)}`;
    if (params.publisher) query += `inpublisher: $(encode)`
}
