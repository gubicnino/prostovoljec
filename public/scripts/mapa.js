let mapContainer;
let map;

function createMapContainer() {
    const existingMap = document.getElementById('mapViewContainer');
    if (existingMap) {
        existingMap.remove();
    }
    
    const mapHtml = `
        <div id="mapViewContainer" class="map-view-container" style="display: none;">
            <div id="googleMap" 
                 style="width: calc(100% - 24px); 
                        height: 600px; 
                        border-radius: 15px; 
                        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                        margin-left: 12px;
                        margin-right: 12px;
                        margin-top: 20px;">
            </div>
        </div>
    `;
    
    const projectsContainer = document.getElementById('projectsContainer');
    if (projectsContainer) {
        projectsContainer.insertAdjacentHTML('afterend', mapHtml);
        mapContainer = document.getElementById('mapViewContainer');
        // Wait for Google Maps to be fully loaded
        if (typeof google !== 'undefined' && google.maps) {
            initMap();
        } else {
            console.error('Google Maps API not loaded yet. Waiting...');
            setTimeout(initMap, 1000); // Retry after 1 second
        }
    }
}

window.initMap = function() {
    const slovenia = { lat: 46.1512, lng: 14.9955 };
    
    try {
        // Preveri ali je google objekt definiran
        if (typeof google === 'undefined') {
            throw new Error('Google Maps API ni pravilno naložen');
        }
        
        // Preveri ali je maps objekt dostopen
        if (typeof google.maps === 'undefined') {
            throw new Error('Google Maps API ni omogočen');
        }
        
        map = new google.maps.Map(document.getElementById("googleMap"), {
            zoom: 8,
            center: slovenia,
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true,
            zoomControl: true,
            gestureHandling: 'greedy' 
        });

        console.log('Google Maps uspešno inicializiran');
        loadProjectMarkers();
    } catch (error) {
        console.error('Napaka pri inicializaciji mape:', error);
    }
}


async function loadProjectMarkers() {
    try {
        const response = await fetch('/api/projekti');
        const projects = await response.json();

        const bounds = new google.maps.LatLngBounds();
        
        projects.forEach(project => {
            const geocoder = new google.maps.Geocoder();
            
            geocoder.geocode({ 
                address: project.Lokacija + ', Slovenia',
                region: 'SI'
            }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    const position = results[0].geometry.location;
                    bounds.extend(position);
                    
                    const marker = new google.maps.Marker({
                        position: position,
                        map: map,
                        title: project.naziv,
                        animation: google.maps.Animation.DROP
                    });

                    const infoWindow = new google.maps.InfoWindow({
                        content: `
                            <style>
                                .gm-style-iw { overflow: hidden !important; padding: 0 !important; }
                                .gm-style-iw-d { overflow: hidden !important; }
                                .gm-style-iw-d::-webkit-scrollbar { display: none !important; }
                                .gm-style-iw > div { overflow: hidden !important; }
                                .map-info-window { overflow: hidden !important; }
                            </style>
                            <div class="map-info-window" style="margin: 0; padding: 0;">
                                <img src="img/campaing-3.jpg" alt="${project.naziv}" 
                                     style="width: 100%; height: 180px; object-fit: cover; display: block;">
                                <div style="padding: 12px;">
                                    <h5 style="margin: 0 0 8px 0; font-size: 17px; line-height: 1.3;">${project.naziv}</h5>
                                    <p style="margin: 0 0 4px 0; font-size: 15px;"><i class="fas fa-building"></i> ${project.drustvo_naziv}</p>
                                    <p style="margin: 0 0 4px 0; font-size: 15px;"><i class="fas fa-map-marker-alt"></i> ${project.Lokacija}</p>
                                    <p style="margin: 0 0 8px 0; font-size: 15px;"><i class="fas fa-calendar"></i> ${new Date(project.datumIzvajanja).toLocaleDateString('sl')}</p>
                                    <a href="project-detail.html?id=${project.idProjekt}" 
                                       class="btn btn-sm btn-primary" style="width: 100%; margin-bottom: 8px;">Več info</a>
                                </div>
                            </div>
                        `,
                        maxWidth: 340,
                        pixelOffset: new google.maps.Size(0, -5)
                    });

                    let isInfoWindowHovered = false;

                    // Add listener for when info window is opened
                    google.maps.event.addListener(infoWindow, 'domready', () => {
                        const container = document.querySelector('.map-info-window');
                        if (container) {
                            container.addEventListener('mouseenter', () => {
                                isInfoWindowHovered = true;
                            });
                            container.addEventListener('mouseleave', () => {
                                isInfoWindowHovered = false;
                                setTimeout(() => {
                                    if (!isInfoWindowHovered) {
                                        infoWindow.close();
                                    }
                                }, 500);
                            });
                        }
                    });

                    // Hover events
                    marker.addListener('mouseover', () => {
                        if (window.currentInfoWindow) {
                            window.currentInfoWindow.close();
                        }
                        infoWindow.open(map, marker);
                        window.currentInfoWindow = infoWindow;
                    });

                    // Click event for navigation
                    marker.addListener('click', () => {
                        window.location.href = `project-detail.html?id=${project.idProjekt}`;
                    });

                    marker.addListener('mouseout', () => {
                        setTimeout(() => {
                            if (!isInfoWindowHovered) {
                                infoWindow.close();
                            }
                        }, 500);
                    });

                    // Fit map to show all markers
                    map.fitBounds(bounds);
                } else {
                    console.warn(`Geocoding failed for address: ${project.Lokacija}`, status);
                }
            });
        });
    } catch (error) {
        console.error('Error loading project markers:', error);
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
            
            viewToggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            if (view === 'map') {
                if (projectsContainer) projectsContainer.style.display = 'none';
                if (pagination) pagination.style.display = 'none';
                if (noProjectsMsg) noProjectsMsg.style.display = 'none';
                
                if (mapContainer) {
                    mapContainer.style.display = 'block';
                    // Check if Google Maps is loaded before triggering resize
                    if (typeof google !== 'undefined' && google.maps && map) {
                        google.maps.event.trigger(map, 'resize');
                    } else {
                        console.warn('Map not initialized yet, initializing now...');
                        initMap();
                    }
                }
            } else {
                if (projectsContainer) projectsContainer.style.display = 'flex';
                if (pagination) pagination.style.display = 'block';
                
                if (mapContainer) {
                    mapContainer.style.display = 'none';
                }
            }
        });
    });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    if (typeof google === 'undefined') {
        console.error('Google Maps API not loaded. Please check your API key and connection.');
        return;
    }
    createMapContainer();
    setupMapToggle();
});