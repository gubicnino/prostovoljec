let mapContainer;

// Kreiraj map container
function createMapContainer() {
    const existingMap = document.getElementById('mapViewContainer');
    if (existingMap) {
        existingMap.remove();
    }
    
    const mapHtml = `
        <div id="mapViewContainer" class="map-view-container" style="display: none;">
            <div class="d-flex justify-content-center">
                <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1189960.4365425394!2d13.940808082353286!3d46.153024486731354!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x476531f5969886d1%3A0x400f81c823fec20!2sLjubljana!5e0!3m2!1ssl!2ssi!4v1748678157418!5m2!1ssl!2ssi" 
                    width="100%" 
                    height="600" 
                    style="border:0; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); max-width: 1200px;" 
                    allowfullscreen="" 
                    loading="lazy" 
                    referrerpolicy="no-referrer-when-downgrade">
                </iframe>
            </div>
        </div>
    `;
    
    const projectsContainer = document.getElementById('projectsContainer');
    if (projectsContainer) {
        projectsContainer.insertAdjacentHTML('afterend', mapHtml);
        mapContainer = document.getElementById('mapViewContainer');
    }
}

// Setup view toggle
function setupMapToggle() {
    const viewToggleBtns = document.querySelectorAll('.view-toggle-btn');
    const projectsContainer = document.getElementById('projectsContainer');
    const pagination = document.querySelector('.pagination')?.parentElement;
    const noProjectsMsg = document.getElementById('niProjektov');
    
    viewToggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.getAttribute('data-view');
            
            if (view === 'map') {
                // Sakrij projekte
                if (projectsContainer) projectsContainer.style.display = 'none';
                if (pagination) pagination.style.display = 'none';
                if (noProjectsMsg) noProjectsMsg.style.display = 'none';
                
                // Prikaži mapu
                if (mapContainer) {
                    mapContainer.style.display = 'block';
                }
            } else {
                // Prikaži projekte
                if (projectsContainer) projectsContainer.style.display = 'flex';
                if (pagination) pagination.style.display = 'block';
                
                // Sakrij mapu
                if (mapContainer) {
                    mapContainer.style.display = 'none';
                }
            }
        });
    });
}

// Inicijalizuj kada se stranica učita
document.addEventListener('DOMContentLoaded', () => {
    createMapContainer();
    setupMapToggle();
});