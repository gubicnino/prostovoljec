function loadProjects() {
    fetch('/api/projekti')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(projects => {
            const container = document.getElementById('projectsContainer');
            const template = document.getElementById('projectTemplate');

            container.innerHTML = '';

            projects.forEach(project => {
                const clone = template.content.cloneNode(true);

                clone.querySelector('.project-image').src = 'img/campaing-3.jpg';
                clone.querySelector('.project-image').alt = project.naziv;
                clone.querySelector('.project-title').textContent = project.naziv;
                clone.querySelector('.project-organization').textContent = project.drustvo_naziv;
                clone.querySelector('.project-location').textContent = project.Lokacija;
                clone.querySelector('.project-duration-hours').textContent = parseUre(project.trajanje);
                clone.querySelector('.project-date').textContent = new Date(project.datumIzvajanja).toLocaleDateString('sl');
                clone.querySelector('.project-deadline').textContent = new Date(project.datumRokaPrijave).toLocaleDateString('sl');
                clone.querySelector('.project-description').textContent = project.kratekOpis || (project.opis?.substring(0, 100) + '...');

                // Ciljki projekta
                clone.querySelector('.project-goal-text').textContent = project.cilj;

                // tezAvnost
                const difficultyBadge = clone.querySelector('.project-difficulty');
                const difficultySpan = difficultyBadge.querySelector('span');
                difficultySpan.textContent = project.tezavnost;
                difficultyBadge.classList.add(getTezavnost(project.tezavnost));

                clone.querySelector('.donate-btn').setAttribute('data-project-id', project.idProjekt);
                container.appendChild(clone);
            });
        });
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
document.addEventListener('DOMContentLoaded', loadProjects);
