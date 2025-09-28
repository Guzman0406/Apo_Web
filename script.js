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
const backFromFavoritesButton = document.getElementById('back-from-favorites');
const contentDetailsContainer = document.getElementById('content-details');
const favoritesListContainer = document.getElementById('favorites-list');

// --- Gestión de Vistas ---
function showView(viewToShow) {
    const allViews = document.querySelectorAll('.view');
    allViews.forEach(view => view.classList.remove('active'));
    viewToShow.classList.add('active');
}

// Event Listeners para la navegación
homeLink.addEventListener('click', (e) => {
    e.preventDefault();
    showView(searchView);
});

favoritesLink.addEventListener('click', (e) => {
    e.preventDefault();
    showView(favoritesView);
    renderFavorites(); // Cuando se accede a la vista de favoritos, se renderiza la lista
});

backToSearchButton.addEventListener('click', () => {
    showView(searchView);
});

backFromFavoritesButton.addEventListener('click', () => {
    showView(searchView);
});


// --- Funcionalidad de Búsqueda ---
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

        // Determina si el elemento ya está en favoritos para cambiar el botón
        const isFavorite = checkIfFavorite(item.id, item.media_type);
        const favoriteButtonClass = isFavorite ? 'card-button favorite remove-favorite' : 'card-button favorite add-favorite';
        const favoriteButtonText = isFavorite ? '<i class="fas fa-minus-circle"></i> Eliminar' : '<i class="fas fa-star"></i> Añadir';


        card.innerHTML = `
            <img src="${posterPath}" alt="${title} Poster">
            <div class="movie-card-info">
                <h3>${title}</h3>
                <p>${year}</p>
                <div class="card-buttons">
                    <button class="card-button details" data-id="${item.id}" data-type="${item.media_type}">Detalles</button>
                    <button class="favorite-toggle-button ${favoriteButtonClass}" data-id="${item.id}" data-type="${item.media_type}" data-title="${title}" data-poster="${posterPath}">
                        ${favoriteButtonText}
                    </button>
                </div>
            </div>
        `;
        resultsContainer.appendChild(card);
    });

    // Añade event listeners para botones de detalles
    document.querySelectorAll('.card-button.details').forEach(button => {
        button.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            const type = e.target.dataset.type;
            fetchDetails(id, type);
        });
    });

    // Añade event listeners para botones de favoritos (añadir/eliminar)
    document.querySelectorAll('.favorite-toggle-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const { id, type, title, poster } = e.target.dataset;
            if (e.target.classList.contains('add-favorite')) {
                addFavorite({ id, type, title, poster });
                e.target.classList.remove('add-favorite');
                e.target.classList.add('remove-favorite');
                e.target.innerHTML = '<i class="fas fa-minus-circle"></i> Eliminar';
            } else {
                removeFavorite(id, type);
                e.target.classList.remove('remove-favorite');
                e.target.classList.add('add-favorite');
                e.target.innerHTML = '<i class="fas fa-star"></i> Añadir';
            }
            renderFavorites(); // Actualiza la lista de favoritos en la vista de favoritos si está activa
        });
    });
}

// --- Funcionalidad de Detalles ---
async function fetchDetails(id, type) {
    contentDetailsContainer.innerHTML = '<p class="placeholder-text">Cargando detalles...</p>';
    showView(detailsView);

    try {
        // Petición para obtener detalles básicos
        const response = await fetch(`${BASE_URL}/${type}/${id}?api_key=${API_KEY}&language=es-ES`);
        const details = await response.json();

        // Petición adicional para obtener los créditos (director, etc.)
        const creditsResponse = await fetch(`${BASE_URL}/${type}/${id}/credits?api_key=${API_KEY}`);
        const credits = await creditsResponse.json();
        details.crew = credits.crew; // Añade la información de crew al objeto details

        displayDetails(details, type);
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
    const director = details.crew ? details.crew.find(person => person.job === 'Director')?.name : 'N/A';

    // Determina si el elemento ya está en favoritos para cambiar el botón
    const isFavorite = checkIfFavorite(details.id, type);
    const favoriteButtonClass = isFavorite ? 'card-button favorite remove-favorite' : 'card-button favorite add-favorite';
    const favoriteButtonText = isFavorite ? '<i class="fas fa-minus-circle"></i> Eliminar de Favoritos' : '<i class="fas fa-star"></i> Añadir a Favoritos';

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
                <button class="favorite-toggle-button ${favoriteButtonClass}" data-id="${details.id}" data-type="${type}" data-title="${title}" data-poster="${posterPath}">
                    ${favoriteButtonText}
                </button>
            </div>
        </div>
    `;

    // Event listener para el botón de favoritos en la vista de detalles
    document.querySelector('.details-buttons .favorite-toggle-button').addEventListener('click', (e) => {
        const { id, type, title, poster } = e.target.dataset;
        if (e.target.classList.contains('add-favorite')) {
            addFavorite({ id, type, title, poster });
            e.target.classList.remove('add-favorite');
            e.target.classList.add('remove-favorite');
            e.target.innerHTML = '<i class="fas fa-minus-circle"></i> Eliminar de Favoritos';
        } else {
            removeFavorite(id, type);
            e.target.classList.remove('remove-favorite');
            e.target.classList.add('add-favorite');
            e.target.innerHTML = '<i class="fas fa-star"></i> Añadir a Favoritos';
        }
        renderFavorites();
    });
}


// --- Funcionalidad de Favoritos  ---

// Carga los favoritos desde localStorage
function getFavorites() {
    const favorites = localStorage.getItem('cinemaLinkFavorites');
    return favorites ? JSON.parse(favorites) : [];
}

// Guarda los favoritos en localStorage
function saveFavorites(favorites) {
    localStorage.setItem('cinemaLinkFavorites', JSON.stringify(favorites));
}

// Comprueba si un elemento ya está en favoritos
function checkIfFavorite(id, type) {
    const favorites = getFavorites();
    return favorites.some(item => item.id === id && item.type === type);
}

// Añade un elemento a favoritos
function addFavorite(item) {
    const favorites = getFavorites();
    // Asegura que no se añadan duplicados
    if (!checkIfFavorite(item.id, item.type)) {
        favorites.push(item);
        saveFavorites(favorites);
        console.log('Añadido a favoritos:', item.title);
    }
}

// Elimina un elemento de favoritos
function removeFavorite(id, type) {
    let favorites = getFavorites();
    favorites = favorites.filter(item => !(item.id === id && item.type === type));
    saveFavorites(favorites);
    console.log('Eliminado de favoritos:', id);
    renderFavorites(); // Vuelve a renderizar la lista después de eliminar
}

// Renderiza la lista de favoritos en la vista de favoritos
function renderFavorites() {
    const favorites = getFavorites();
    favoritesListContainer.innerHTML = ''; // Limpia la lista actual

    if (favorites.length === 0) {
        favoritesListContainer.innerHTML = '<p class="placeholder-text">Aún no tienes elementos favoritos. ¡Busca y añade algunos!</p>';
        return;
    }

    favorites.forEach(item => {
        const favoriteItemDiv = document.createElement('div');
        favoriteItemDiv.classList.add('favorite-item');

        const posterSrc = item.poster ? `${item.poster}` : 'https://via.placeholder.com/80x120?text=No+Poster'; // Usa el poster guardado

        favoriteItemDiv.innerHTML = `
            <img src="${posterSrc}" alt="${item.title} Poster">
            <div class="favorite-info">
                <h3>${item.title}</h3>
                <p>${item.type === 'movie' ? 'Película' : 'Serie'}</p>
            </div>
            <button class="favorite-remove-button" data-id="${item.id}" data-type="${item.type}">
                <i class="fas fa-times-circle"></i> Eliminar
            </button>
        `;
        favoritesListContainer.appendChild(favoriteItemDiv);
    });

    // Añade event listeners para los botones de eliminar de la lista de favoritos
    document.querySelectorAll('.favorite-remove-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const { id, type } = e.target.dataset;
            removeFavorite(id, type);
        });
    });
}


// Inicializa la vista por defecto al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    showView(searchView);
});