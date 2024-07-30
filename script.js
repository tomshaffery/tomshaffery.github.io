const jsonbinMasterKey = '$2a$10$sslSXL61DXW4U0Mohwh9ouHV16e5gdsF5fVnKPMXHP4mm8anoabmC';
const jsonbinID = '667d865facd3cb34a85e2bc3';

// JSONBIN.IO RELEVANT FUNCTIONS
async function getBin() {
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${jsonbinID}/latest`, {
            headers: {
                'X-Master-Key': jsonbinMasterKey
            }
        });
        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to fetch bin data:', error);
        throw error;
    }
}

async function updateBin(data) {
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${jsonbinID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': jsonbinMasterKey
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        const updatedData = await response.json();
        return updatedData;
    } catch (error) {
        console.error('Failed to update bin data:', error);
        throw error;
    }
}

function displayData(data) {
    const resultDiv = document.getElementById('result');
    delete data.metadata;
    delete data.records;
    resultDiv.textContent = `${JSON.stringify(data, null, 2)}`;
}

// USER REGISTRATION/LOGIN FUNCTIONS
async function register() {
    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;

    try {
        let binData = await getBin();
        if (binData.record.users.some(user => user.username === username)) {
            console.log('User already exists');
            document.getElementById('result').textContent = 'User already exists';
            return;
        }

        const newUser = {
            username,
            password,
            booklist: [],
            groups: [],
        };
        binData.record.users.push(newUser);
        await updateBin(binData.record);
        console.log('User registered successfully');
        alert('User registered successfully');
        document.getElementById('result').textContent = 'User registered successfully';
        getBin();  // Fetch and display updated data
    } catch (error) {
        console.error('Failed to register user:', error);
        document.getElementById('result').textContent = 'Failed to register user. See console for details.';
    }
}
async function login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const binData = await getBin();
        const user = binData.record.users.find(user => user.username === username && user.password === password);

        if (!user) {
            alert('Invalid credentials');
            return;
        }

        // User authenticated successfully
        sessionStorage.setItem('username', username);
        window.location.href = 'homepage.html';
    } catch (error) {
        console.error('Failed to login:', error);
        document.getElementById('result').textContent = 'Failed to login. See console for details.';
    }
}

// FETCHING BOOK FUNCTIONS
let searchParameter = 'intitle';

function searchSelect(element, parameter) {
    searchParameter = parameter;
    const searchInput = document.getElementById('searchInput');
    searchInput.placeholder = `Search by ${element.textContent}`;
}

async function searchBooks() {
    const apiKey = 'AIzaSyDEEzOr0fGC0CycWr0oZ_LkzYL62ZPzu9o';
    const searchInput = document.getElementById('searchInput').value;
    const recDiv = document.getElementById('recommendations');
    recDiv.style.display = "none";

    if (searchInput.trim() !== '') {
        const query = `${searchParameter}:${searchInput.trim()}`;
        const apiURL = `https://www.googleapis.com/books/v1/volumes?q=${query}&key=${apiKey}&maxResults=40`;
        
        try {
            const response = await fetch(apiURL);
            const data = await response.json();
            if (data.items && data.items.length > 0) {
                const filteredBooks = data.items.filter(book => {
                    if (searchParameter === 'inauthor') {
                        return book.volumeInfo.authors && book.volumeInfo.authors.some(author => author.toLowerCase().includes(searchInput.toLowerCase()));
                    }
                    return true;
                });
                displayBooks(filteredBooks);
            } else {
                displayBooks([]);
            }
        } catch (error) {
            console.error('Failed to fetch books:', error);
            displayBooks([]); // Show no books found message in case of error
        }
    } else {
        alert('Please enter a search keyword.');
    }
}

function displayBooks(books) {
    const resultDiv = document.getElementById('search-results');

    resultDiv.innerHTML = ''; // Clear previous results
    resultDiv.style.overflowY = "auto";
    resultDiv.style.overflowX = "hidden";
    resultDiv.style.position = "fixed";
    resultDiv.style.top = "22.5vh";
    resultDiv.style.left = "20vw";
    resultDiv.style.width = "65vw";
    resultDiv.style.height = "70vh";

    if (!books || books.length === 0) {
        resultDiv.textContent = 'No books found.';
        return;
    }

    const bookGrid = document.createElement('div');
    bookGrid.classList.add('row', 'row-cols-1', 'row-cols-md-3', 'g-4');
    bookGrid.style.position = "relative";
    bookGrid.style.zIndex = "0";

    books.forEach(book => {
        const bookCard = document.createElement('div');
        bookCard.classList.add('col');
        bookCard.style.position = "relative";
        bookCard.style.zIndex = "0";

        const card = document.createElement('div');
        card.style.backdropFilter = "blur(5px)";
        card.style.backgroundColor = "rgba(46, 37, 83, 0.267)";
        card.classList.add('card', 'h-100');

        const coverImage = book.volumeInfo.imageLinks ? book.volumeInfo.imageLinks.thumbnail : 'placeholder.jpg';
        const img = document.createElement('img');
        img.src = coverImage;
        img.style.height = "400px";
        img.classList.add('card-img-top');
        img.alt = book.volumeInfo.title;
        img.onclick = () => showBookDetails(book);

        const cardBody = document.createElement('div');
        cardBody.classList.add('card-body');
        cardBody.style.textAlign = "center";

        const cardTitle = document.createElement('h5');
        cardTitle.classList.add('card-title');
        cardTitle.textContent = book.volumeInfo.title;

        cardBody.appendChild(cardTitle);
        card.appendChild(img);
        card.appendChild(cardBody);
        bookCard.appendChild(card);
        bookGrid.appendChild(bookCard);
    });

    resultDiv.appendChild(bookGrid);
}

async function showBookDetails(book) {
    const bookDetailsBody = document.getElementById('bookDetailsBody');
    bookDetailsBody.innerHTML = ''; // Clear previous details

    const bookInfo = book.volumeInfo;

    const title = document.createElement('h3');
    title.textContent = bookInfo.title || 'No Title Available';
    bookDetailsBody.appendChild(title);

    const authors = document.createElement('p');
    authors.textContent = `Authors: ${bookInfo.authors ? bookInfo.authors.join(', ') : 'No Authors Available'}`;
    bookDetailsBody.appendChild(authors);

    const description = document.createElement('p');
    description.textContent = `Description: ${bookInfo.description || 'No Description Available'}`;
    bookDetailsBody.appendChild(description);

    const publishedDate = document.createElement('p');
    publishedDate.textContent = `Published Date: ${bookInfo.publishedDate || 'No Published Date Available'}`;
    bookDetailsBody.appendChild(publishedDate);

    let bookIsbn = null;
    if (bookInfo.industryIdentifiers) {
        const isbnList = document.createElement('p');
        isbnList.textContent = 'ISBNs: ';
        bookInfo.industryIdentifiers.forEach(identifier => {
            isbnList.textContent += `${identifier.type}: ${identifier.identifier} `;
            if (identifier.type === 'ISBN_13' || identifier.type === 'ISBN_10') {
                bookIsbn = identifier.identifier;
            }
        });
        bookDetailsBody.appendChild(isbnList);
    }

    const pageCount = document.createElement('p');
    pageCount.textContent = `Page Count: ${bookInfo.pageCount || 'No Page Count Available'}`;
    bookDetailsBody.appendChild(pageCount);

    const addToList = document.createElement('button');
    addToList.className = 'btn btn-primary';
    addToList.setAttribute("id", "addToList-button");

    const username = sessionStorage.getItem('username');

    if (!username) {
        alert('You need to be logged in to view book details.');
        return;
    }

    try {
        let binData = await getBin();
        const user = binData.record.users.find(user => user.username === username);

        console.log("User booklist:", user.booklist);
        console.log("Current book ISBN:", bookIsbn);

        const bookExists = user.booklist.some(userBook => {
            return userBook.industryIdentifiers.some(identifier => {
                const userBookIsbn = identifier.identifier;
                console.log("Comparing with user book ISBN:", userBookIsbn);
                return userBookIsbn === bookIsbn;
            });
        });

        if (bookExists) {
            addToList.textContent = 'Book already in your booklist';
            addToList.className = 'btn btn-secondary';
            addToList.disabled = true;
        } else {
            addToList.textContent = 'Add to your reading list';
            addToList.onclick = () => { 
                addBookToBooklist(book); 
                setTimeout(() => { changeButtonState(addToList); }, 100); 
            };
        }
        bookDetailsBody.appendChild(addToList);
    } catch (error) {
        console.error('Failed to check if book is in bookshelf:', error);
    }

    const modal = new bootstrap.Modal(document.getElementById('bookDetailsModal'));
    modal.show();
}

function changeButtonState(button) {
    button.className = 'btn btn-success';
    button.textContent = 'Book Added';
    button.disabled = true;
}

async function addBookToBooklist(book) {
    const username = sessionStorage.getItem('username');
    if (!username) {
        alert('You need to be logged in to add books to your reading list.');
        return;
    }

    try {
        let binData = await getBin();
        const user = binData.record.users.find(user => user.username === username);

        const bookInfo = {
            title: book.volumeInfo.title || 'No Title Available',
            authors: book.volumeInfo.authors || ['No Authors Available'],
            description: book.volumeInfo.description || 'No Description Available',
            publishedDate: book.volumeInfo.publishedDate || 'No Published Date Available',
            industryIdentifiers: book.volumeInfo.industryIdentifiers || [],
            pageCount: book.volumeInfo.pageCount || 'No Page Count Available',
            image: book.volumeInfo.imageLinks.thumbnail || 'placeholder.jpg'
        };

        user.booklist.push(bookInfo);
        await updateBin(binData.record);
        console.log('Book added to reading list');
        document.getElementById('result').textContent = 'Book added to reading list';

    } catch (error) {
        console.error('Failed to add book to reading list:', error);
        document.getElementById('result').textContent = 'Failed to add book to reading list. See console for details.';
    }
}

async function viewBookshelf() {
    const username = sessionStorage.getItem('username');
    if (!username) {
        alert('You need to be logged in to view your bookshelf.');
        return;
    }

    try {
        const binData = await getBin();
        const user = binData.record.users.find(user => user.username === username);
        if (user && user.booklist.length > 0) {
            displayBookshelf(user.booklist);
        } else {
            const resultDiv = document.getElementById('result');
            if (resultDiv) {
                const emptyDisplay = document.createElement('div');
                emptyDisplay.setAttribute("id", "emptyDisplay");
                emptyDisplay.innerHTML = `<h3>Your bookshelf is empty.</h3>`;
                resultDiv.appendChild(emptyDisplay);
            } else {
                console.error('Result element not found in the DOM.');
            }
        }
    } catch (error) {
        console.error('Failed to fetch bookshelf:', error);
        const resultDiv = document.getElementById('result');
        if (resultDiv) {
            resultDiv.textContent = 'Failed to fetch bookshelf. See console for details.';
        } else {
            console.error('Result element not found in the DOM.');
        }
    }
}

function displayBookshelf(booklist) {
    const resultDiv = document.getElementById('result');
    if (!resultDiv) {
        console.error('Result element not found in the DOM.');
        return;
    }

    resultDiv.innerHTML = '<h2>Your Bookshelf</h2>';
    resultDiv.style.overflowY = "auto";
    resultDiv.style.overflowX = "hidden";
    resultDiv.style.position = "fixed";
    resultDiv.style.top = "22.5vh";
    resultDiv.style.left = "20vw";
    resultDiv.style.width = "65vw";
    resultDiv.style.height = "70vh";

    const bookGrid = document.createElement('div');
    bookGrid.classList.add('row', 'row-cols-1', 'row-cols-md-3', 'g-4');
    bookGrid.style.position = "relative";
    bookGrid.style.zIndex = "0";
    
    booklist.forEach(book => {
        const bookImage = book.image;

        const bookCard = document.createElement('div');
        bookCard.classList.add('col');
        bookCard.style.position = "relative";
        bookCard.style.zIndex = "0";

        const card = document.createElement('div');
        card.style.backdropFilter = "blur(5px)";
        card.style.backgroundColor = "rgba(46, 37, 83, 0.267)";
        card.classList.add('card', 'h-50');

        const img = document.createElement('img');
        img.src = bookImage;
        img.style.height = "400px";
        img.classList.add('card-img-top');
        img.alt = book.title;
        img.onclick = () => showBookShelfDetails(book);

        const cardBody = document.createElement('div');
        cardBody.classList.add('card-body');
        cardBody.style.textAlign = "center";

        const cardTitle = document.createElement('h5');
        cardTitle.classList.add('card-title');
        cardTitle.textContent = book.title;

        cardBody.appendChild(cardTitle);
        card.appendChild(img);
        card.appendChild(cardBody);
        bookCard.appendChild(card);
        bookGrid.appendChild(bookCard);


        resultDiv.appendChild(bookGrid);
    });
}

function showBookShelfDetails(book) {
    const bookShelfDetailsBody = document.getElementById('bookShelfDetailsBody');
    bookShelfDetailsBody.innerHTML = ''; // Clear previous details

    const bookTitle = book.title;
    const title = document.createElement('h3');
    title.textContent = `${bookTitle}`;
    bookShelfDetailsBody.appendChild(title);

    const bookAuthor = book.authors;
    const authors = document.createElement('p');
    authors.textContent = `Authors: ${bookAuthor}`;
    bookShelfDetailsBody.appendChild(authors);

    const bookDescription = book.description;
    const description = document.createElement('p');
    description.textContent = `Description: ${bookDescription}`;
    bookShelfDetailsBody.appendChild(description);

    const bookPublishedDate = book.publishedDate;
    const publishedDate = document.createElement('p');
    publishedDate.textContent = `Published Date: ${bookPublishedDate}`;
    bookShelfDetailsBody.appendChild(publishedDate);

    const bookIdentifiers = book.industryIdentifiers;
    if (bookIdentifiers) {
        const isbnList = document.createElement('p');
        isbnList.textContent = 'ISBNs: ';
        bookIdentifiers.forEach(identifier => {
            isbnList.textContent += `${identifier.type}: ${identifier.identifier} `;
        });
        bookShelfDetailsBody.appendChild(isbnList);
    }

    const bookPages = book.pageCount;
    const pageCount = document.createElement('p');
    pageCount.textContent = `Page Count: ${bookPages}`;
    bookShelfDetailsBody.appendChild(pageCount);

    const removeFromList = document.createElement('button');
    removeFromList.textContent = `Remove ${bookTitle}`;
    removeFromList.className = 'btn btn-danger'; 
    removeFromList.onclick = () => removeBookFromList(book);
    bookShelfDetailsBody.appendChild(removeFromList);

    const modal = new bootstrap.Modal(document.getElementById('bookShelfDetailsModal'));
    modal.show();
}

async function removeBookFromList(book) {
    const username = sessionStorage.getItem('username');
    
    if (!username) {
        alert('You need to be logged in to add books to your reading list.');
        return;
    }

    const bookIsbn = book.industryIdentifiers.find(identifier => identifier.type === 'ISBN_13' || identifier.type === 'ISBN_10').identifier;

    try {
        let binData = await getBin();
        const user = binData.record.users.find(user => user.username === username);

        user.booklist = user.booklist.filter(userBook => {
            const userBookIsbn = userBook.industryIdentifiers.find(identifier => identifier.type === 'ISBN_13' || identifier.type === 'ISBN_10').identifier;
            return userBookIsbn !== bookIsbn;
        });
        
        await updateBin(binData.record);
        
        document.getElementById('result').textContent = 'Book successfully removed.';
        window.location.href = 'bookshelf.html';

    } catch (error) {
        console.error('Failed to remove book from bookshelf:', error);
        document.getElementById('result').textContent = 'Failed to remove book from bookshelf. See console for details.';
    }
}

async function getRecommendedBooks() {
    const username = sessionStorage.getItem('username');
    const apiKey = 'AIzaSyDEEzOr0fGC0CycWr0oZ_LkzYL62ZPzu9o';
    const recDiv = document.getElementById('recommendations');
    var randomRecs = document.createElement("span");
   

    if (!username) {
        alert('You need to be logged in to view your bookshelf.');
        return;
    }

    try {
    let binData = await getBin();
    const user = binData.record.users.find(user => user.username === username);
    
    if (user && user.booklist.length > 0) {

        const randomBookNumber = Math.floor(Math.random() * user.booklist.length);
        console.log(randomBookNumber);
        const randomBook = user.booklist[randomBookNumber];
        const randomAuthor = randomBook.authors[0];
        const randomStart = Math.floor(Math.random() * 51);

        const search = `https://www.googleapis.com/books/v1/volumes?q=+inauthor:${randomAuthor}&key=${apiKey}&startIndex=${randomStart}&maxResults=6`;
        
        try {
            const randomBooks = await fetch(search);
            const randomBooksData = await randomBooks.json();
            if (randomBooksData.items && randomBooksData.items.length > 0) {
                const filteredRandom = randomBooksData.items.filter(book => {
                    if (searchParameter === 'inauthor') {
                        return book.volumeInfo.authors && book.volumeInfo.authors.some(author => author.toLowerCase().includes(searchInput.toLowerCase()));
                    }
                    return true;
                });
                displayBooks(filteredRandom);

            } else {
                displayBooks([]);
            }
        } catch (error) {
            console.error('Failed to fetch books:', error);
            displayBooks([]); // Show no books found message in case of error
        }
    } else {

        
        
        const genres = ['Literary Fiction', 'Contemporary Fiction', 'Romance', 'Historical Fiction', 'Thriller', 'Horror', 'Mystery', 'Action & Adventure', 'Science Fiction', 'Fantasy', 'Paranormal', 'Western', 'Dystopian', 'LGBTQ+', 'Graphic Novel', 'Biography', 'Travel', 'True Crime', 'Cookbooks', 'Religion', 'Philosophy', 'Art', 'Photography', 'Humor', 'Poetry', 'Travel'];
        const randomPull = Math.floor(Math.random() * genres.length);
        const searchRandom = genres[randomPull];
        const randomStart = Math.floor(Math.random() * 101);
        const search = `https://www.googleapis.com/books/v1/volumes?q=+subject:${searchRandom}&key=${apiKey}&maxResults=6&startIndex=${randomStart}`;
        
        try {
            const randomBooks = await fetch(search);
            const randomBooksData = await randomBooks.json();
            if (randomBooksData.items && randomBooksData.items.length > 0) {
                const filteredRandom = randomBooksData.items.filter(book => {
                    if (searchParameter === 'inauthor') {
                        return book.volumeInfo.authors && book.volumeInfo.authors.some(author => author.toLowerCase().includes(searchInput.toLowerCase()));
                    }
                    return true;
                });
                displayBooks(filteredRandom);

            } else {
                displayBooks([]);
            }
            
        } catch (error) {
            console.error('Failed to fetch books:', error);
            displayBooks([]); // Show no books found message in case of error
        }
    }

        
    }
    catch (error) {
        alert('An error has occurred.');
        return;
    }

    randomRecs.innerHTML = "Try One of These Recommendations:";
    recDiv.appendChild(randomRecs);
}

// Search activation

// Get the input field
var input = document.getElementById("searchInput");

// Execute a function when the user releases a key on the keyboard
input.addEventListener("keyup", function(event) {
  // Number 13 is the "Enter" key on the keyboard
  if (event.keyCode === 13) {
    // Cancel the default action, if needed
    event.preventDefault();
    // Trigger the button element with a click
    document.getElementById("searchButton").click();
  }
});

function signOut() {
    sessionStorage.removeItem('username');
    window.location.href = 'index.html'; // Redirect to login page or homepage
}

function handleRegister() {
    register();
}

function handleLogin() {
    login();
}

function handleSearchBooks() {
    searchBooks();
}
