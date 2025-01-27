const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const searchBySelect = document.getElementById('search-by');
const resultsDiv = document.getElementById('results');
const paginationDiv = document.getElementById('pagination');

let currentPage = 1;
let currentQuery = '';
let currentSearchBy = 'title';
let resultsPerPage = calculateResultsPerPage();
let previousResults = []; 
const maxVisiblePages = 4;

window.addEventListener('resize', () => {
  resultsPerPage = calculateResultsPerPage();
});

searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  resultsDiv.innerHTML = '';
  paginationDiv.innerHTML = '';
  currentPage = 1;
  currentQuery = searchInput.value.trim();
  currentSearchBy = searchBySelect.value;

  if (!currentQuery) {
    resultsDiv.innerHTML = '<p>Por favor, introduce un término de búsqueda.</p>';
    return;
  }

  if (currentSearchBy === 'isbn' && currentQuery.length < 10) {
    await fetchAndDisplayResults();
  } else if (currentSearchBy === 'isbn') {
    await fetchAndDisplayResults();
  } else {
    await fetchAndDisplayResults();
  }
});

async function fetchAndDisplayResults() {
  const url = buildApiUrl();
  if (!url) return;

  try {
    resultsDiv.innerHTML = '<p>Cargando resultados...</p>';
    const response = await fetch(url);

    if (!response.ok) {
      resultsDiv.innerHTML = `<p>Error: ${response.status} - ${response.statusText}</p>`;
      return;
    }

    const data = await response.json();

    console.log('API Response:', data);

    if (data.docs.length === 0) {
      resultsDiv.innerHTML = '<p>No se encontraron resultados para la búsqueda.</p>';
      paginationDiv.innerHTML = '';
    } else {
      previousResults = data.docs;
      displayResults(previousResults);
      displayPagination(data.numFound);
    }
  } catch (error) {
    resultsDiv.innerHTML = '<p>Ocurrió un error al buscar. Inténtalo de nuevo.</p>';
    console.error('Fetch Error:', error);
  }
}

function filterByISBN(isbn) {
  if (previousResults.length === 0) {
    resultsDiv.innerHTML = '<p>No hay resultados previos para filtrar. Realizando nueva búsqueda...</p>';
    fetchAndDisplayResults();
    return;
  }

  const filteredResults = previousResults.filter((book) => {
    const bookIsbns = book.isbn || [];
    return bookIsbns.some((bookIsbn) => bookIsbn.includes(isbn));
  });

  if (filteredResults.length === 0) {
    resultsDiv.innerHTML = `<p>No se encontraron libros con el ISBN que contiene '${isbn}'.</p>`;
    paginationDiv.innerHTML = '';
  } else {
    displayResults(filteredResults);
    displayPagination(filteredResults.length);
  }
}

function calculateResultsPerPage() {
  const resultHeight = 120;
  const availableHeight = window.innerHeight - 200;
  return Math.floor(availableHeight / resultHeight);
}

function buildApiUrl() {
  const startIndex = (currentPage - 1) * resultsPerPage;
  let url = `https://openlibrary.org/search.json?limit=${resultsPerPage}&offset=${startIndex}`;

  if (currentSearchBy === 'isbn') {
    const isbn = currentQuery.trim().replace(/[^0-9X]/gi, '');
    if (isbn.length !== 13 && isbn.length !== 10) {
      resultsDiv.innerHTML = '<p>Por favor, introduce un ISBN válido.</p>';
      return null;
    }
    url += `&isbn=${isbn}`;
  } else {
    url += `&${currentSearchBy}=${encodeURIComponent(currentQuery)}`;
  }

  console.log(`Generated URL: ${url}`);
  return url;
}

function displayResults(books) {
  resultsDiv.innerHTML = '';
  
  books.forEach((book) => {
    const bookElement = document.createElement('div');
    bookElement.classList.add('book');
  
    const coverImage = book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg` : 'default-image.jpg';
  
    bookElement.innerHTML = `
      <div class="book-item">
        <img src="${coverImage}" alt="Portada de ${book.title}" class="book-cover"/>
        <div class="book-info">
          <h3>${book.title}</h3>
          <p><strong>Autor:</strong> ${book.author_name ? book.author_name.join(', ') : 'Desconocido'}</p>
          <p><strong>Año:</strong> ${book.first_publish_year || 'Desconocido'}</p>
        </div>
      </div>
    `;
  
    resultsDiv.appendChild(bookElement);
  });
}

function displayPagination(totalResults) {
  paginationDiv.innerHTML = '';
  const totalPages = Math.ceil(totalResults / resultsPerPage);

  if (currentPage > 1) {
    const prevButton = createPaginationButton('«', () => {
      currentPage--;
      fetchAndDisplayResults();
    });
    paginationDiv.appendChild(prevButton);
  }

  const intervals = calculateIntervals(totalPages);
  intervals.forEach((page, index) => {
    if (index > 0 && page - intervals[index - 1] > 1) {
      const dots = document.createElement('span');
      dots.textContent = '...';
      dots.classList.add('dots');
      paginationDiv.appendChild(dots);
    }

    const pageButton = createPaginationButton(page, () => {
      currentPage = page;
      fetchAndDisplayResults();
    });
    if (page === currentPage) pageButton.classList.add('active');

    paginationDiv.appendChild(pageButton);
  });

  if (currentPage < totalPages) {
    const nextButton = createPaginationButton('»', () => {
      currentPage++;
      fetchAndDisplayResults();
    });
    paginationDiv.appendChild(nextButton);
  }
}

function createPaginationButton(label, onClick) {
  const button = document.createElement('button');
  button.textContent = label;
  button.classList.add('page-btn');
  button.addEventListener('click', onClick);
  return button;
}

function calculateIntervals(totalPages) {
  const intervals = [];
  const visiblePages = maxVisiblePages;

  if (totalPages > 1) intervals.push(1);

  let start = Math.max(2, currentPage - Math.floor(visiblePages / 2));
  let end = Math.min(totalPages - 1, start + visiblePages - 1);

  for (let i = start; i <= end; i++) {
    if (!intervals.includes(i)) intervals.push(i);
  }

  if (!intervals.includes(totalPages)) intervals.push(totalPages);
  return intervals.sort((a, b) => a - b);
}
