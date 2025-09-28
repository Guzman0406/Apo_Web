// Constantes para la API de TMDb
const API_KEY = '21d85b4f5bb54a791da2ef0cfa984f62'; 
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// Referencias a elementos del DOM
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const resultsContainer = document.getElementById('results-container');

// Elementos de navegación y vistas
const homeLink = document.getElementById('home-link');
const favoritesLink = document.getElementById('favorites-link');
const searchView = document.getElementById('search-view');
const detailsView = document.getElementById('details-view');
const favoritesView = document.getElementById('favorites-view'); 
const backToSearchButton = document.getElementById('back-to-search');
const contentDetailsContainer = document.getElementById('content-details');

// --- Gestión de Vistas ---
function showView(viewToShow) {
    // Oculta todas las vistas
    const allViews = document.querySelectorAll('.view');
    allViews.forEach(view => view.classList.remove('active'));
    // Muestra la vista deseada
    viewToShow.classList.add('active');
}

// Event Listeners para la navegación
homeLink.addEventListener('click', (e) => {
    e.preventDefault();
    showView(searchView);
});

backToSearchButton.addEventListener('click', () => {
    showView(searchView);
});

// --- Funcionalidad de Búsqueda (ya existente) ---
searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();

    if (query) {
        await searchContent(query);
    }
});

async function searchContent(query) {
    resultsContainer.innerHTML = '<p class="placeholder-text">Buscando...</p>';

    try {
        const response = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${query}&language=es-ES`);
        const data = await response.json();

        displayResults(data.results);
    } catch (error) {
        console.error('Error al buscar contenido:', error);
        resultsContainer.innerHTML = '<p class="placeholder-text">Error al cargar los resultados. Inténtalo de nuevo.</p>';
    }
}

function displayResults(results) {
    resultsContainer.innerHTML = '';

    if (results.length === 0) {
        resultsContainer.innerHTML = '<p class="placeholder-text">No se encontraron resultados para tu búsqueda.</p>';
        return;
    }

    const filteredResults = results.filter(
        (item) => item.media_type === 'movie' || item.media_type === 'tv'
    );

    if (filteredResults.length === 0) {
        resultsContainer.innerHTML = '<p class="placeholder-text">No se encontraron películas o series para tu búsqueda.</p>';
        return;
    }

    filteredResults.forEach((item) => {
        const card = document.createElement('div');
        card.classList.add('movie-card');

        const title = item.media_type === 'movie' ? item.title : item.name;
        const releaseDate = item.media_type === 'movie' ? item.release_date : item.first_air_date;
        const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
        const posterPath = item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : 'https://via.placeholder.com/200x300?text=No+Poster';

        card.innerHTML = `
            <img src="${posterPath}" alt="${title} Poster">
            <div class="movie-card-info">
                <h3>${title}</h3>
                <p>${year}</p>
                <div class="card-buttons">
                    <button class="card-button details" data-id="${item.id}" data-type="${item.media_type}">Detalles</button>
                    <button class="card-button favorite" data-id="${item.id}" data-type="${item.media_type}"><i class="fas fa-star"></i></button>
                </div>
            </div>
        `;
        resultsContainer.appendChild(card);
    });

    // Añade el event listener para los botones de detalles DESPUÉS de que se rendericen
    document.querySelectorAll('.card-button.details').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            const type = e.target.dataset.type;
            fetchDetails(id, type); // Llama a la función para obtener y mostrar detalles
        });
    });
}

// --- Funcionalidad de Detalles ---
async function fetchDetails(id, type) {
    contentDetailsContainer.innerHTML = '<p class="placeholder-text">Cargando detalles...</p>';
    showView(detailsView); // Muestra la vista de detalles

    try {
        const response = await fetch(`${BASE_URL}/${type}/${id}?api_key=${API_KEY}&language=es-ES`);
        const details = await response.json();

        displayDetails(details, type); // Muestra los detalles obtenidos
    } catch (error) {
        console.error(`Error al obtener detalles de ${type} con ID ${id}:`, error);
        contentDetailsContainer.innerHTML = '<p class="placeholder-text">Error al cargar los detalles. Inténtalo de nuevo.</p>';
    }
}

function displayDetails(details, type) {
    const posterPath = details.poster_path ? `${IMAGE_BASE_URL}${details.poster_path}` : 'https://via.placeholder.com/300x450?text=No+Poster';
    const title = type === 'movie' ? details.title : details.name;
    const originalTitle = type === 'movie' ? details.original_title : details.original_name;
    const releaseDate = type === 'movie' ? details.release_date : details.first_air_date;
    const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
    const overview = details.overview || 'No hay sinopsis disponible.';
    const voteAverage = details.vote_average ? details.vote_average.toFixed(1) : 'N/A';
    const genres = details.genres ? details.genres.map(genre => genre.name).join(', ') : 'N/A';
    const director = details.crew ? details.crew.find(person => person.job === 'Director')?.name : 'N/A'; // Solo para películas

    contentDetailsContainer.innerHTML = `
        <img src="${posterPath}" alt="${title} Poster" class="details-poster">
        <div class="details-info">
            <h2>${title} (${year})</h2>
            ${title !== originalTitle ? `<p><strong>Título Original:</strong> ${originalTitle}</p>` : ''}
            <p><strong>Género:</strong> ${genres}</p>
            ${type === 'movie' && director !== 'N/A' ? `<p><strong>Director:</strong> ${director}</p>` : ''}
            <p><strong>Calificación:</strong> <span class="rating">${voteAverage} <i class="fas fa-star"></i></span></p>
            <p class="overview"><strong>Sinopsis:</strong> ${overview}</p>
            <div class="details-buttons">
                <button class="card-button favorite" data-id="${details.id}" data-type="${type}"><i class="fas fa-star"></i> Añadir a Favoritos</button>
            </div>
        </div>
    `;
}

// Inicializa la vista por defecto al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    showView(searchView);
});