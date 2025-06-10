let currentPopup = null;
let hoverTimeout = null;

// Vaš Mapbox access token (zamenjajte z pravim)
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoicGV0YXIxMzA2IiwiYSI6ImNtYmphZTI5czBkNHQyaXBqZ2U3cmVhbzUifQ.uXoTGXst52A40QIKgbsmfg';

// Funkcija za onemogućavanje skrolovanja stranice
function disablePageScroll() {
    document.body.style.overflow = 'hidden';
}

// Funkcija za omogućavanje skrolovanja stranice
function enablePageScroll() {
    document.body.style.overflow = 'auto';
}

function createMapContainer() {
    const existingMap = document.getElementById('mapViewContainer');
    if (existingMap) {
        existingMap.remove();
    }
    
    // Dodamo Mapbox CSS in JS, če še nista naložena
    if (!document.querySelector('link[href*="mapbox-gl"]')) {
        const mapboxCSS = document.createElement('link');
        mapboxCSS.href = 'https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css';
        mapboxCSS.rel = 'stylesheet';
        document.head.appendChild(mapboxCSS);
    }

    if (!document.querySelector('script[src*="mapbox-gl"]')) {
        const mapboxJS = document.createElement('script');
        mapboxJS.src = 'https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.js';
        mapboxJS.onload = initMap;
        document.head.appendChild(mapboxJS);
    }
    
    const mapHtml = `
        <div id="mapViewContainer" class="map-view-container" style="display: none;">
            <div id="mapboxMap" 
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
        
        // Dodaj event listenere za onemogućavanje skrolovanja kada je miš na mapi
        const mapElement = document.getElementById('mapboxMap');
        if (mapElement) {
            mapElement.addEventListener('mouseenter', disablePageScroll);
            mapElement.addEventListener('mouseleave', enablePageScroll);
        }
        
        // Poskus inicializacije mape
        if (typeof mapboxgl !== 'undefined') {
            initMap();
        } else {
            console.log('Mapbox se nalaga...');
        }
    }
}

function initMap() {
    try {
        if (typeof mapboxgl === 'undefined') {
            console.error('Mapbox GL JS ni naložen');
            return;
        }

        mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
        
        map = new mapboxgl.Map({
            container: 'mapboxMap',
            style: 'mapbox://styles/mapbox/streets-v12', // Sodoben stil cest
            center: [14.9955, 46.1512], // Slovenija [lng, lat]
            zoom: 7.5,
            attributionControl: false // Odstranimo privzeto atribucijo
        });

        // Dodamo kontrole
        map.addControl(new mapboxgl.NavigationControl(), 'top-right');
        map.addControl(new mapboxgl.FullscreenControl(), 'top-right');
        
        // Prilagojena atribucija
        map.addControl(new mapboxgl.AttributionControl({
            compact: true,
            customAttribution: '© Mapbox © OpenStreetMap'
        }), 'bottom-right');

        // Ko se mapa naloži, dodaj označevalce
        map.on('load', () => {
            console.log('Mapbox mapa uspešno inicializirana');
            loadProjectMarkers();
        });

    } catch (error) {
        console.error('Napaka pri inicializaciji Mapbox mape:', error);
    }
}

// Funkcija za ustvarjanje prilagojene rdeče ikone pina
function createCustomPinIcon() {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const size = 40;
        
        canvas.width = size;
        canvas.height = size;
        
        // Narišemo rdečo ikono pina
        ctx.fillStyle = '#dc3545'; // Rdeča barva kot grozdi
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        
        // Pin oblika
        const centerX = size / 2;
        const centerY = size / 3;
        const radius = 12;
        
        // Krog
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        
        // Spodnji del pina
        ctx.beginPath();
        ctx.moveTo(centerX, centerY + radius - 4);
        ctx.lineTo(centerX, size - 4);
        ctx.lineTo(centerX - 3, centerY + radius + 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Bela pika v sredini
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 4, 0, 2 * Math.PI);
        ctx.fill();
        
        resolve(canvas);
    });
}

// Funkcija za formatiranje datuma
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('sl-SI', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Funkcija za dobivanje težavnosti badge-a
function getDifficultyBadge(difficulty) {
    const difficultyMap = {
        'Nizka': { color: 'success', text: 'Nizka' },
        'Srednja': { color: 'warning', text: 'Srednja' },
        'Visoka': { color: 'danger', text: 'Visoka' }
    };
    
    const diff = difficultyMap[difficulty] || { color: 'secondary', text: difficulty || 'Neznana' };
    return `<span class="badge bg-${diff.color} text-white">${diff.text}</span>`;
}

// Funkcija za ustvarjanje kompaktnega popup-a
function createProjectPopupContent(project) {
    const projectImage = getProjectImage(project);
    const formattedDateIzvajanja = formatDate(project.datumIzvajanja);
    const formattedDateRok = formatDate(project.datumRokaPrijave);
    
    return `
        <div class="campaign-card compact-popup" style="width: 280px; border-radius: 12px; overflow: hidden; box-shadow: 0 6px 20px rgba(0,0,0,0.15); background: white; padding-bottom: 15px">
            <!-- Kompaktna slika - smanjena visina -->
            <div class="campaign-image position-relative">
                <img src="${projectImage}" alt="${project.naziv}" class="w-100" 
                     style="height: 200px; object-fit: cover;"
                     onerror="this.src='img/campaing-3.jpg';">
                <!-- Ure u gornjem desnom kotu -->
                <div class="position-absolute rounded-pill bg-danger text-white shadow-sm d-flex align-items-center py-1 px-2"
                     style="top: 8px; right: 8px; z-index: 10;">
                    <span class="fw-bold" style="font-size: 0.8rem;">${project.trajanje || '6'}</span>
                    <span style="font-size: 0.7rem;" class="ms-1">ur</span>
                </div>
                <!-- Težavnost u spodnjem levom kotu -->
                <div class="position-absolute" style="bottom: 8px; left: 8px;">
                    <span class="badge" style="background: rgba(0,0,0,0.7); color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.7rem;">
                        <i class="fas fa-person-hiking me-1"></i>
                        ${project.tezavnost || 'Ni podatka'}
                    </span>
                </div>
            </div>
            
            <!-- Smanjeni padding i kompaktniji sadržaj -->
            <div style="padding: 15px 15px 0 15px;">
                <!-- Naslov -->
                <h4 class="fw-bold mb-2" style="font-size: 0.9rem; line-height: 1.2; color: #333; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                    ${project.naziv}
                </h4>
                
                <!-- Organizacija -->
                <p class="text-muted mb-2" style="font-size: 0.75rem; margin-bottom: 8px !important;">
                    <i class="fas fa-building me-1" style="color: #dc3545;"></i> 
                    ${project.drustvo_naziv}
                </p>
                
                <!-- Lokacija -->
                <div class="d-flex align-items-center mb-2" style="font-size: 0.75rem; margin-bottom: 8px !important;">
                    <i class="fas fa-location-dot text-danger me-1"></i>
                    <span>${project.Lokacija}</span>
                </div>
                
                <!-- Datumi - kompaktno -->
                <div style="font-size: 0.7rem; margin-bottom: 8px;">
                    <div class="d-flex align-items-center mb-1">
                        <i class="fas fa-calendar-days text-primary me-1"></i>
                        <span><strong>Izvaja:</strong> ${formattedDateIzvajanja}</span>
                    </div>
                    <div class="d-flex align-items-center">
                        <i class="fas fa-calendar-xmark text-info me-1"></i>
                        <span><strong>Prijave do:</strong> ${formattedDateRok}</span>
                    </div>
                </div>
                
                <!-- Kratek opis - još kompaktniji -->
                <p class="text-dark mb-2" style="font-size: 0.8rem; line-height: 1.2; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 10px !important;">
                    ${project.opis || 'Opis projekta ni na voljo'}
                </p>
                
                <!-- Gumb -->
                <a href="project-detail.html?id=${project.idProjekt}" 
                   class="btn w-100 d-flex align-items-center justify-content-center gap-2"
                   style="background: linear-gradient(135deg, #dc3545, #c82333); color: white; border: none; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.8rem; padding: 8px 12px; transition: all 0.3s ease;"
                   onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(220,53,69,0.4)';"
                   onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                    <span>Više informacija</span>
                    <i class="fas fa-arrow-right"></i>
                </a>
            </div>
        </div>
    `;
}

// ISPRAVLJENA funkcija za pametan positioning popup-a tako da ostane u granicama mape
function getSmartPopupOffset(markerCoordinates) {
    const mapCanvas = map.getCanvas();
    const mapRect = mapCanvas.getBoundingClientRect();
    const markerPoint = map.project(markerCoordinates);
    
    // Dimenzije popup-a
    const popupWidth = 280;
    const popupHeight = 200;
    const padding = 20;
    const pinDistance = 5; // Bliza pin-u - smanjeno sa 30
    
    // Dostupan prostor levo i desno
    const spaceLeft = markerPoint.x;
    const spaceRight = mapRect.width - markerPoint.x;
    
    let offsetX = 0;
    let offsetY = 0;
    let anchor = 'left';
    
    // Logika: Uvek prikaži SAMO levo ili desno, gde ima više prostora
    if (spaceLeft >= popupWidth + padding && spaceLeft >= spaceRight) {
        // Prikaži levo od pin-a
        offsetX = -popupWidth/2 - pinDistance;
        anchor = 'right';
    } else if (spaceRight >= popupWidth + padding) {
        // Prikaži desno od pin-a
        offsetX = popupWidth/2 + pinDistance;
        anchor = 'left';
    } else if (spaceLeft > spaceRight) {
        // Nema dovoljno prostora, ali levo je bolje
        offsetX = -popupWidth/2 - pinDistance;
        anchor = 'right';
    } else {
        // Nema dovoljno prostora, ali desno je bolje
        offsetX = popupWidth/2 + pinDistance;
        anchor = 'left';
    }
    
    // Vertikalno centriranje - popup se prikazuje na istoj visini kao pin
    offsetY = 0;
    
    // Proveri da li popup izlazi van granica mape vertikalno
    const popupTop = markerPoint.y - popupHeight/2;
    const popupBottom = markerPoint.y + popupHeight/2;
    
    if (popupTop < padding) {
        // Popup je previše gore, pomeri dole
        offsetY = padding - popupTop;
    } else if (popupBottom > mapRect.height - padding) {
        // Popup je previše dole, pomeri gore
        offsetY = (mapRect.height - padding) - popupBottom;
    }
    
    return {
        offset: [offsetX, offsetY],
        anchor: anchor
    };
}

async function loadProjectMarkers() {
    try {
        const response = await fetch('/api/projekti');
        const projects = await response.json();

        // Koordinate za prilagajanje mape
        const coordinates = [];
        
        // Ustvari GeoJSON source za označevalce
        const geojsonData = {
            type: 'FeatureCollection',
            features: []
        };

        // Geokodiranje za vsak projekt
        const geocodePromises = projects.map(project => 
            geocodeAddress(project.Lokacija + ', Slovenia', project)
        );

        const geocodedProjects = await Promise.all(geocodePromises);
        
        geocodedProjects.forEach(result => {
            if (result && result.coordinates) {
                const [lng, lat] = result.coordinates;
                coordinates.push([lng, lat]);
                
                // Dodaj feature v GeoJSON
                geojsonData.features.push({
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [lng, lat]
                    },
                    properties: {
                        ...result.project,
                        coordinates: [lng, lat]
                    }
                });
            }
        });

        // Dodaj source za označevalce
        map.addSource('projects', {
            type: 'geojson',
            data: geojsonData,
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 50
        });

        // Layer za kroge grozdov - rdeči
        map.addLayer({
            id: 'clusters',
            type: 'circle',
            source: 'projects',
            filter: ['has', 'point_count'],
            paint: {
                'circle-color': [
                    'step',
                    ['get', 'point_count'],
                    '#dc3545', // Rdeča barva za majhne grozde
                    5,
                    '#c82333', // Temnejša rdeča za srednje grozde
                    10,
                    '#a71e2a'  // Najtemnejša rdeča za velike grozde
                ],
                'circle-radius': [
                    'step',
                    ['get', 'point_count'],
                    20,
                    5,
                    30,
                    10,
                    40
                ]
            }
        });

        // Layer za številke v grozdih
        map.addLayer({
            id: 'cluster-count',
            type: 'symbol',
            source: 'projects',
            filter: ['has', 'point_count'],
            layout: {
                'text-field': '{point_count_abbreviated}',
                'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                'text-size': 12
            },
            paint: {
                'text-color': '#ffffff' // Bela barva za besedilo
            }
        });

        // Ustvari prilagojeno rdečo ikono pina
        const pinCanvas = await createCustomPinIcon();
        const pinImage = new Image();
        pinImage.onload = () => {
            map.addImage('custom-red-pin', pinImage);
            
            // Layer za posamezne označevalce - rdeči pin
            map.addLayer({
                id: 'unclustered-point',
                type: 'symbol',
                source: 'projects',
                filter: ['!', ['has', 'point_count']],
                layout: {
                    'icon-image': 'custom-red-pin',
                    'icon-size': 0.8,
                    'icon-anchor': 'bottom',
                    'icon-allow-overlap': true
                }
            });
        };
        pinImage.src = pinCanvas.toDataURL();

        // ========================================================================
        // POJEDNOSTAVLJENI HOVER EFEKT SA DODATNIM EVENT LISTENERIMA ZA POPUP
        // ========================================================================
        map.on('mouseenter', 'unclustered-point', (e) => {
            map.getCanvas().style.cursor = 'pointer';
            
            // Otkaži postojeći timeout
            if (hoverTimeout) {
                clearTimeout(hoverTimeout);
                hoverTimeout = null;
            }
            
            // Ukloni postojeći popup
            if (currentPopup) {
                currentPopup.remove();
                currentPopup = null;
            }
            
            const project = e.features[0].properties;
            const coordinates = e.features[0].geometry.coordinates;
            
            // Pametan offset
            const smartPosition = getSmartPopupOffset(coordinates);
            
            // Ustvari popup
            const popupContent = createProjectPopupContent(project);

            currentPopup = new mapboxgl.Popup({ 
                offset: smartPosition.offset,
                anchor: smartPosition.anchor,
                closeButton: false,
                closeOnClick: false,
                closeOnMove: false,
                maxWidth: '300px',
                className: 'custom-compact-popup'
            })
                .setLngLat(coordinates)
                .setHTML(popupContent)
                .addTo(map);

            // Dodaj hover handling za popup nakon kratke pauze
            setTimeout(() => {
                const popupElement = currentPopup?._content;
                if (popupElement) {
                    // Onemogući skrolovanje i kada je miš na popup-u
                    popupElement.addEventListener('mouseenter', () => {
                        disablePageScroll();
                        if (hoverTimeout) {
                            clearTimeout(hoverTimeout);
                            hoverTimeout = null;
                        }
                    });
                    
                    popupElement.addEventListener('mouseleave', () => {
                        enablePageScroll();
                        hoverTimeout = setTimeout(() => {
                            if (currentPopup) {
                                currentPopup.remove();
                                currentPopup = null;
                            }
                        }, 100);
                    });
                }
            }, 50);
        });

        map.on('mouseleave', 'unclustered-point', () => {
            map.getCanvas().style.cursor = '';
            
            // Postavi timeout za zatvaranje
            hoverTimeout = setTimeout(() => {
                if (currentPopup) {
                    currentPopup.remove();
                    currentPopup = null;
                }
                // Omogući skrolovanje kada nema popup-a
                enablePageScroll();
            }, 200);
        });

        // Hover efekt za grozde
        map.on('mouseenter', 'clusters', () => {
            map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', 'clusters', () => {
            map.getCanvas().style.cursor = '';
        });

        // Klik na grozd - povećaj
        map.on('click', 'clusters', (e) => {
            const features = map.queryRenderedFeatures(e.point, {
                layers: ['clusters']
            });
            const clusterId = features[0].properties.cluster_id;
            map.getSource('projects').getClusterExpansionZoom(
                clusterId,
                (err, zoom) => {
                    if (err) return;
                    map.easeTo({
                        center: features[0].geometry.coordinates,
                        zoom: zoom
                    });
                }
            );
        });

        // Zapri popup ob kliku na mapu (ne na marker)
        map.on('click', (e) => {
            const features = map.queryRenderedFeatures(e.point, {
                layers: ['unclustered-point', 'clusters']
            });
            
            // Če nismo kliknuli na marker ili grozd, zapri popup
            if (features.length === 0 && currentPopup) {
                currentPopup.remove();
                currentPopup = null;
                // Omogući skrolovanje kada zatvorimo popup
                enablePageScroll();
            }
        });

        // Prilagodi mapu, da prikaže sve označevalce
        if (coordinates.length > 0) {
            const bounds = coordinates.reduce((bounds, coord) => {
                return bounds.extend(coord);
            }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));
            
            map.fitBounds(bounds, {
                padding: { top: 50, bottom: 50, left: 50, right: 50 }
            });
        }

    } catch (error) {
        console.error('Napaka pri nalaganju označevalcev:', error);
    }
}


// Funkcija za geokodiranje z uporabo Mapbox Geocoding API
async function geocodeAddress(address, project) {
    try {
        const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&country=SI&limit=1`
        );
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
            return {
                coordinates: data.features[0].center,
                project: project
            };
        }
        return null;
    } catch (error) {
        console.error(`Geokodiranje neuspešno za ${address}:`, error);
        return null;
    }
}

// Funkcija za določevanje slike projekta
function getProjectImage(project) {
    if (project.slika && project.slika.trim() !== '') {
        if (project.slika.startsWith('img/')) {
            return project.slika;
        }
        return `img/projekti/${project.slika}`;
    }
    return 'img/campaing-3.jpg';
}

// Nastavitev preklapljanja pogleda
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
                    // Spremeni velikost mape, ko se prikaže
                    if (map) {
                        setTimeout(() => {
                            map.resize();
                        }, 100);
                    }
                }
            } else {
                // Kada se prebacujemo sa mape, omogući skrolovanje
                enablePageScroll();
                
                if (projectsContainer) projectsContainer.style.display = 'flex';
                if (pagination) pagination.style.display = 'block';
                
                if (mapContainer) {
                    mapContainer.style.display = 'none';
                }
            }
        });
    });
}

// ISPRAVLJENI custom CSS stilovi za kompaktne popup-e
function addCustomPopupStyles() {
    if (!document.querySelector('#custom-popup-styles')) {
        const style = document.createElement('style');
        style.id = 'custom-popup-styles';
        style.textContent = `
            .mapboxgl-popup {
                max-width: none !important;
            }
            
            .mapboxgl-popup-content {
                padding: 0 !important;
                border-radius: 12px !important;
                box-shadow: 0 6px 20px rgba(0,0,0,0.15) !important;
                border: none !important;
            }
            
            .mapboxgl-popup-tip {
                border-top-color: white !important;
                border-bottom-color: white !important;
            }
            
            .custom-compact-popup .mapboxgl-popup-content {
                overflow: hidden;
                max-width: 280px;
            }
            
            .compact-popup {
                transform: scale(1);
                transition: transform 0.2s ease;
            }
            
            .compact-popup:hover {
                transform: scale(1.02);
            }
        `;
        document.head.appendChild(style);
    }
}

// Alternativno lahko neposredno vključite Mapbox v HTML
function addMapboxToHead() {
    if (!document.querySelector('link[href*="mapbox-gl"]')) {
        const css = document.createElement('link');
        css.href = 'https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css';
        css.rel = 'stylesheet';
        document.head.appendChild(css);
    }

    if (!document.querySelector('script[src*="mapbox-gl"]')) {
        const script = document.createElement('script');
        script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.js';
        script.onload = () => {
            addCustomPopupStyles(); // Dodaj custom stilove
            createMapContainer();
            setupMapToggle();
        };
        document.head.appendChild(script);
    }
}

// Inicializiraj, ko se stran naloži
document.addEventListener('DOMContentLoaded', () => {
    addMapboxToHead();
});