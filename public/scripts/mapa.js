// mapbox-mapa.js - Nova različica z Mapbox-om

let mapContainer;
let map;
let markers = [];

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

        // Dodaj source in layer za označevalce
        map.addSource('projects', {
            type: 'geojson',
            data: geojsonData,
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 50
        });

        // Layer za kroge grozdov
        map.addLayer({
            id: 'clusters',
            type: 'circle',
            source: 'projects',
            filter: ['has', 'point_count'],
            paint: {
                'circle-color': [
                    'step',
                    ['get', 'point_count'],
                    '#51bbd6',
                    5,
                    '#f1c40f',
                    10,
                    '#f28cb1'
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
            }
        });

        // Layer za posamezne označevalce
        map.addLayer({
            id: 'unclustered-point',
            type: 'circle',
            source: 'projects',
            filter: ['!', ['has', 'point_count']],
            paint: {
                'circle-color': '#3498db',
                'circle-radius': 8,
                'circle-stroke-width': 2,
                'circle-stroke-color': '#fff'
            }
        });

        // Hover efekt
        map.on('mouseenter', 'unclustered-point', () => {
            map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', 'unclustered-point', () => {
            map.getCanvas().style.cursor = '';
        });

        // Klik na grozd - povečaj
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

        // Klik na posamezen označevalec
        map.on('click', 'unclustered-point', (e) => {
            const project = e.features[0].properties;
            
            // Ustvari vsebino pojavnega okna
            const projectImage = getProjectImage(project);
            
            const popupContent = `
                <div class="map-info-window">
                    <img src="${projectImage}" alt="${project.naziv}" class="map-info-window-img" 
                        onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                    <div class="no-image">
                        <i class="fas fa-image"></i><br>
                        Slika ni na voljo
                    </div>
                    <h4>${project.naziv}</h4>
                    <p>
                        <i class="fas fa-building"></i> ${project.drustvo_naziv}
                    </p>
                    <p>
                        <i class="fas fa-map-marker-alt"></i> ${project.Lokacija}
                    </p>
                    <p>
                        <i class="fas fa-calendar"></i> ${new Date(project.datumIzvajanja).toLocaleDateString('sl')}
                    </p>
                    <a href="project-detail.html?id=${project.idProjekt}" class="btn">
                        Več informacij
                    </a>
                </div>
            `;

            new mapboxgl.Popup({ offset: 25 })
                .setLngLat(e.features[0].geometry.coordinates)
                .setHTML(popupContent)
                .addTo(map);
        });

        // Prilagodi mapo, da prikaže vse označevalce
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