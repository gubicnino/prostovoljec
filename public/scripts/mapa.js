// mapbox-mapa.js - Ispravljena verzija s crvenim pinovima i poboljšanim hover efektom

let mapContainer;
let map;
let markers = [];
let currentPopup = null; // Za shranjevanje trenutnega oblačka
let isMouseOverPopup = false; // Za sledenje, ali je miška nad oblačkom
let isMouseOverMarker = false; // Za sledenje, ali je miška nad označevalcem
let popupTimeout = null; // Za upravljanje timeout funkcija

// Vaš Mapbox access token (zamenjajte z pravim)
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoicGV0YXIxMzA2IiwiYSI6ImNtYmphZTI5czBkNHQyaXBqZ2U3cmVhbzUifQ.uXoTGXst52A40QIKgbsmfg';

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

// Funkcija za centriranje popup-a u vidljivom području
function centerPopupInView(popup, coordinates) {
    setTimeout(() => {
        const mapCanvas = map.getCanvas();
        const mapRect = mapCanvas.getBoundingClientRect();
        const popupElement = popup.getElement();
        
        if (!popupElement) return;
        
        const popupRect = popupElement.getBoundingClientRect();
        const popupWidth = popupRect.width;
        const popupHeight = popupRect.height;
        
        // Dobijamo trenutni centar mape
        const currentCenter = map.getCenter();
        const markerPoint = map.project(coordinates);
        
        let needsReposition = false;
        let newCenter = { ...currentCenter };
        
        // Proveravamo da li je popup van granica levo/desno
        if (popupRect.left < mapRect.left + 20) {
            // Popup je van leve granice
            const offsetPixels = (mapRect.left + 20 - popupRect.left) + popupWidth/2;
            const offsetLngLat = map.unproject([markerPoint.x - offsetPixels, markerPoint.y]);
            newCenter.lng = offsetLngLat.lng;
            needsReposition = true;
        } else if (popupRect.right > mapRect.right - 20) {
            // Popup je van desne granice
            const offsetPixels = (popupRect.right - mapRect.right + 20) + popupWidth/2;
            const offsetLngLat = map.unproject([markerPoint.x + offsetPixels, markerPoint.y]);
            newCenter.lng = offsetLngLat.lng;
            needsReposition = true;
        }
        
        // Proveravamo da li je popup van granica gore/dole
        if (popupRect.top < mapRect.top + 20) {
            // Popup je van gornje granice
            const offsetPixels = (mapRect.top + 20 - popupRect.top) + popupHeight/2;
            const offsetLngLat = map.unproject([markerPoint.x, markerPoint.y - offsetPixels]);
            newCenter.lat = offsetLngLat.lat;
            needsReposition = true;
        } else if (popupRect.bottom > mapRect.bottom - 20) {
            // Popup je van donje granice
            const offsetPixels = (popupRect.bottom - mapRect.bottom + 20) + popupHeight/2;
            const offsetLngLat = map.unproject([markerPoint.x, markerPoint.y + offsetPixels]);
            newCenter.lat = offsetLngLat.lat;
            needsReposition = true;
        }
        
        // Ako treba da se repozicionira mapa
        if (needsReposition) {
            map.easeTo({
                center: [newCenter.lng, newCenter.lat],
                duration: 300,
                essential: true
            });
        }
    }, 100); // Čekamo da se popup renderuje
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

        // Poboljšan hover efekt sa centriranjem
        map.on('mouseenter', 'unclustered-point', (e) => {
            map.getCanvas().style.cursor = 'pointer';
            isMouseOverMarker = true;
            
            // Očisti obstoječi timeout
            if (popupTimeout) {
                clearTimeout(popupTimeout);
                popupTimeout = null;
            }
            
            // Zapri prejšnji oblaček, če obstaja
            if (currentPopup) {
                currentPopup.remove();
                currentPopup = null;
            }
            
            const project = e.features[0].properties;
            const coordinates = e.features[0].geometry.coordinates;
            
            // Ustvari vsebino pojavnega okna
            const projectImage = getProjectImage(project);
            
            const popupContent = `
                <div class="map-info-window" style="width: 300px; max-width: 300px;">
                    <img src="${projectImage}" alt="${project.naziv}" class="map-info-window-img" 
                        style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px; margin-bottom: 10px;"
                        onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                    <div class="no-image" style="display: none; text-align: center; padding: 20px; background: #f5f5f5; border-radius: 8px; margin-bottom: 10px;">
                        <i class="fas fa-image" style="font-size: 24px; color: #ccc; margin-bottom: 8px;"></i><br>
                        <span style="color: #666;">Slika ni na voljo</span>
                    </div>
                    <h4 style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">${project.naziv}</h4>
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: #666;">
                        <i class="fas fa-building" style="margin-right: 8px; color: #dc3545;"></i> ${project.drustvo_naziv}
                    </p>
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: #666;">
                        <i class="fas fa-map-marker-alt" style="margin-right: 8px; color: #dc3545;"></i> ${project.Lokacija}
                    </p>
                    <p style="margin: 0 0 12px 0; font-size: 14px; color: #666;">
                        <i class="fas fa-calendar" style="margin-right: 8px; color: #dc3545;"></i> ${new Date(project.datumIzvajanja).toLocaleDateString('sl')}
                    </p>
                    <a href="project-detail.html?id=${project.idProjekt}" class="btn" 
                       style="display: inline-block; background: #dc3545; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-size: 14px;">
                        Več informacij
                    </a>
                </div>
            `;

            // Ustvari oblaček brez X gumba
            currentPopup = new mapboxgl.Popup({ 
                offset: 25,
                closeButton: false,
                closeOnClick: false,
                closeOnMove: false,
                maxWidth: '320px'
            })
                .setLngLat(coordinates)
                .setHTML(popupContent)
                .addTo(map);

            // Centrovaj popup da bude vidljiv
            centerPopupInView(currentPopup, coordinates);

            // Dodaj event listenerje za oblaček po kratki zamudi (da se DOM posodobi)
            setTimeout(() => {
                const popupElement = currentPopup?._content;
                if (popupElement) {
                    popupElement.addEventListener('mouseenter', () => {
                        isMouseOverPopup = true;
                        if (popupTimeout) {
                            clearTimeout(popupTimeout);
                            popupTimeout = null;
                        }
                    });
                    
                    popupElement.addEventListener('mouseleave', () => {
                        isMouseOverPopup = false;
                        schedulePopupClose();
                    });
                }
            }, 50);
        });

        // Funkcija za načrtovanje zaprtja popup-a
        function schedulePopupClose() {
            if (popupTimeout) {
                clearTimeout(popupTimeout);
            }
            
            popupTimeout = setTimeout(() => {
                if (!isMouseOverPopup && !isMouseOverMarker && currentPopup) {
                    currentPopup.remove();
                    currentPopup = null;
                }
                popupTimeout = null;
            }, 150);
        }

        // Posodobi stanje, ko miška zapusti označevalec
        map.on('mouseleave', 'unclustered-point', () => {
            map.getCanvas().style.cursor = '';
            isMouseOverMarker = false;
            schedulePopupClose();
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
            
            // Če nismo kliknili na marker ili grozd, zapri popup
            if (features.length === 0 && currentPopup) {
                currentPopup.remove();
                currentPopup = null;
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

// Nastavitev preklapljanja pogleda - enako kot prej
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
                if (projectsContainer) projectsContainer.style.display = 'flex';
                if (pagination) pagination.style.display = 'block';
                
                if (mapContainer) {
                    mapContainer.style.display = 'none';
                }
            }
        });
    });
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