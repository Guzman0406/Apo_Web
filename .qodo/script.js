const API_KEY = '21d85b4f5bb54a791da2ef0cfa984f62'; 
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500'; 

// Referencias a elementos del DOM
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const resultsContainer = document.getElementById('results-container');

// Event listener para el formulario de búsqueda
searchForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Previene el envío por defecto del formulario (recarga la página)
    const query = searchInput.value.trim(); 

    if (query) {
        await searchContent(query); 
    }
});

// Función para buscar contenido en la API de TMDb
async function searchContent(query) {
    resultsContainer.innerHTML = '<p class="placeholder-text">Buscando...</p>'; // Muestra mensaje de carga

    try {
        const response = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${query}&language=es-ES`);
        const data = await response.json();

        displayResults(data.results); // Muestra los resultados obtenidos
    } catch (error) {
        console.error('Error al buscar contenido:', error);
        resultsContainer.innerHTML = '<p class="placeholder-text">Error al cargar los resultados. Inténtalo de nuevo.</p>';
    }
}

// Función para mostrar los resultados en el DOM
function displayResults(results) {
    resultsContainer.innerHTML = ''; // Limpia el contenedor de resultados previos

    if (results.length === 0) {
        resultsContainer.innerHTML = '<p class="placeholder-text">No se encontraron resultados para tu búsqueda.</p>';
        return;
    }

    // Filtra para mostrar solo películas y series (ignora personas, etc.)
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

        // Determina el título y la fecha según el tipo de contenido
        const title = item.media_type === 'movie' ? item.title : item.name;
        const releaseDate = item.media_type === 'movie' ? item.release_date : item.first_air_date;
        const year = releaseDate ? new Date(releaseDate).getFullYear() : 'N/A';
        const posterPath = item.poster_path ? `${IMAGE_BASE_URL}${item.poster_path}` : 'https://via.placeholder.com/200x300?text=No+Poster'; // Placeholder si no hay póster

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
}

