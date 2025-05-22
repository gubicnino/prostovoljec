const PROJECTS_PER_PAGE = 12;

function loadProjects(apiUrl = '/api/projekti', containerId = 'projectsContainer', templateId = 'projectTemplate') {
    const urlParams = new URLSearchParams(window.location.search);
    const currentPage = parseInt(urlParams.get('page')) || 1;

    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(projects => {
            console.log(projects);
            const container = document.getElementById(containerId);
            const template = document.getElementById(templateId);

            container.innerHTML = '';

            // Paginaccija
            const totalPages = Math.ceil(projects.length / PROJECTS_PER_PAGE);
            const startIndex = (currentPage - 1) * PROJECTS_PER_PAGE;
            const endIndex = startIndex + PROJECTS_PER_PAGE;
            const currentProjects = projects.slice(startIndex, endIndex);

            currentProjects.forEach(project => {
                const clone = template.content.cloneNode(true);

                clone.querySelector('.project-image').src = 'img/campaing-3.jpg';
                clone.querySelector('.project-image').alt = project.naziv;
                clone.querySelector('.project-title').textContent = project.naziv;
                clone.querySelector('.project-organization').textContent = project.drustvo_naziv;
                clone.querySelector('.project-location').textContent = project.Lokacija;
                clone.querySelector('.project-duration-hours').textContent = project.trajanje;
                clone.querySelector('.project-date').textContent = new Date(project.datumIzvajanja).toLocaleDateString('sl');
                clone.querySelector('.project-deadline').textContent = new Date(project.datumRokaPrijave).toLocaleDateString('sl');
                clone.querySelector('.project-description').textContent = project.kratekOpis || (project.opis?.substring(0, 100) + '...');
                clone.querySelector('.project-goal-text').textContent = project.cilj;

                // Težavnost
                const difficultyBadge = clone.querySelector('.project-difficulty');
                const difficultySpan = difficultyBadge.querySelector('span');
                difficultySpan.textContent = project.tezavnost;
                difficultyBadge.classList.add(getTezavnost(project.tezavnost));

                clone.querySelector('.donate-btn').setAttribute('data-project-id', project.idProjekt);
                clone.querySelector('.donate-btn').setAttribute('onclick', `window.location.href='project-detail.html?id=${project.idProjekt}'`);
                
                container.appendChild(clone);
            });

            updatePagination(currentPage, totalPages);
        })
        .catch(error => {
            console.error('Error loading projects:', error);
        });
}

function updatePagination(currentPage, totalPages) {
    const paginationContainer = document.querySelector('.pagination');
    if (!paginationContainer) return;

    paginationContainer.innerHTML = '';

    // Dinamično pridobi ime trenutne strani
    const pageName = window.location.pathname.split('/').pop();

    // nazaj -> stran -1
    if (currentPage > 1) {
        paginationContainer.innerHTML += `
            <li class="page-item">
                <a class="page-link" href="${pageName}?page=${currentPage - 1}" aria-label="Previous">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </li>
        `;
    }

    // stevilke strani
    for (let i = 1; i <= totalPages; i++) {
        paginationContainer.innerHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="${pageName}?page=${i}">${i}</a>
            </li>
        `;
    }

    // Next stran
    if (currentPage < totalPages) {
        paginationContainer.innerHTML += `
            <li class="page-item">
                <a class="page-link" href="${pageName}?page=${currentPage + 1}" aria-label="Next">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </li>
        `;
    }
}

function getTezavnost(tezavnost) {
    switch (tezavnost.toLowerCase()) {
        case 'nizka': return 'bg-success';
        case 'srednja': return 'bg-warning';
        case 'visoka': return 'bg-danger';
        default: return 'bg-secondary';
    }
}

function parseUre(timeString) {
    const parts = timeString.split(':');
    if (parts.length >= 1) {
        return parseInt(parts[0]);
    }
    return 0;
}

document.addEventListener('DOMContentLoaded', function () {
    const page = window.location.pathname.split('/').pop();

    if (page === 'index.html' || page === '') {
        // latest 3 projekti (po datumee)
        loadProjects('/api/projekti/latest', 'projectsContainer', 'projectTemplate');
    } else if (page === 'projekti.html') {
        // Vsi projekti
        loadProjects('/api/projekti');
    } else if (page === 'profil.html') {
        // Projekti za prijavljeno društvo
        const drustvoId = localStorage.getItem('drustvoId');
        const prostovoljecId = localStorage.getItem('prostovoljecId');
        if (drustvoId) {
            loadProjects(`/api/projekti/drustvo?id=${drustvoId}`);
        } else if (prostovoljecId) {
            loadProjects(`/api/projekti/prostovoljec?id=${prostovoljecId}`, 'projectsContainerProstovoljec', 'projectTemplateProstovoljec');
        } else {
            // fallback ali opozorilo
            loadProjects();
        }
    } else {
        // Privzeto (če želiš)
        loadProjects();
    }
});