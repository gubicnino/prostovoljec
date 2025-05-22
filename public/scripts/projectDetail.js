document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');

    if (projectId) {
        loadProjectDetails(projectId);
        loadProjectVolunteers(projectId);
    }
});

async function loadProjectDetails(projectId) {
    const response = await fetch(`/api/projekti/${projectId}`);
    const data = await response.json();
    updateProjectDetails(data);
}

async function loadProjectVolunteers(projectId) {
    const response = await fetch(`/api/projekti/${projectId}/volunteers`);
    const volunteers = await response.json();
    displayVolunteers(volunteers);
}

function updateProjectDetails(data) {
    console.log(data);
    document.title = `ManusMano - ${data.naziv}`;
    updateElementContent('project-title', data.naziv);
    updateElementContent('breadcrumb-title', data.naziv);
    updateElementContent('project-title-tab', data.naziv);
    updateElementContent('project-description', data.opis);
    updateElementContent('project-goal', data.cilj);
    updateElementContent('project-location', data.Lokacija);
    updateElementContent('req-location', data.Lokacija);

    updateElementContent('project-organization', data.drustvo_naziv);
    updateElementContent('drustvo-email', data.drustvo_email || 'Email ni na voljo');
    updateElementContent('drustvo-tel', data.drustvo_tel || 'Telefon ni na voljo');
    
    const emailLink = document.getElementById('drustvo-email-link');
    if (emailLink && data.drustvo_email) {
        emailLink.href = `mailto:${data.drustvo_email}`;
    }
    
    const telLink = document.getElementById('drustvo-tel-link');
    if (telLink && data.drustvo_tel) {
        telLink.href = `tel:${data.drustvo_tel}`;
    }

    const volunteerCount = parseInt(data.stevilo_prijavljenih) || 0;
    const capacity = parseInt(data.kapaciteta) || 0;
    updateElementContent('volunteer-count', `${volunteerCount}/${capacity}`);

    const progressBar = document.getElementById('volunteer-progress');
    if (progressBar && capacity > 0) {
        const percentage = Math.min((volunteerCount / capacity) * 100, 100);
        progressBar.style.width = `${percentage}%`;
        progressBar.setAttribute('aria-valuenow', percentage);
        
        if (percentage >= 100) {
            progressBar.classList.remove('bg-primary', 'bg-warning');
            progressBar.classList.add('bg-danger');
        } else if (percentage >= 75) {
            progressBar.classList.remove('bg-primary', 'bg-danger');
            progressBar.classList.add('bg-warning');
        } else {
            progressBar.classList.remove('bg-warning', 'bg-danger');
            progressBar.classList.add('bg-primary');
        }
    }

    const difficultyBadge = document.getElementById('project-difficulty');
    if (difficultyBadge) {
        let badgeClass = 'bg-success';
        switch (data.tezavnost.toLowerCase()) {
            case 'visoka':
                badgeClass = 'bg-danger';
                break;
            case 'srednja':
                badgeClass = 'bg-warning text-dark';
                break;
            case 'nizka':
                badgeClass = 'bg-success';
                break;
        }
        difficultyBadge.className = `badge px-3 py-2 fs-6 ${badgeClass}`;
        difficultyBadge.innerHTML = `
            <i class="fas fa-person-hiking me-2"></i>
            <span class="project-difficulty-text">${data.tezavnost}</span>
        `;
    }

    const statusText = document.getElementById('project-status');
    if (statusText) {
        if (volunteerCount >= capacity) {
            statusText.textContent = 'Zasedeno';
            statusText.className = 'badge bg-danger';
        } else if (volunteerCount >= capacity * 0.75) {
            statusText.textContent = 'Skoraj polno';
            statusText.className = 'badge bg-warning text-dark';
        } else {
            statusText.textContent = 'Odprto';
            statusText.className = 'badge bg-success';
        }
    }

    const izvajanje = new Date(data.datumIzvajanja).toLocaleDateString('sl-SI');
    const rokPrijave = new Date(data.datumRokaPrijave).toLocaleDateString('sl-SI');
    updateElementContent('project-date', izvajanje);
    updateElementContent('project-deadline', rokPrijave);

    const duration = data.trajanje || 0;
    updateElementContent('project-hours', duration);
    updateElementContent('project-time-commitment', `${duration} ur`);
    loadProjectEdit(data);
}

function displayVolunteers(volunteers) {
    const volunteersContainer = document.getElementById('volunteers-list');
    if (!volunteersContainer) return;

    if (!volunteers || volunteers.length === 0) {
        volunteersContainer.innerHTML = `
            <div class="text-center py-4">
                <p class="text-muted mb-0">Na tem projektu še ni prijavljenih prostovoljcev.</p>
            </div>
        `;
        return;
    }

    const volunteersHTML = volunteers.map(volunteer => `
        <li class="list-group-item px-0 border-bottom d-flex align-items-center py-3">
            <div class="rounded-circle bg-light p-2 me-3">
                <i class="fas fa-user text-primary"></i>
            </div>
            <div class="flex-grow-1">
                <div class="d-flex justify-content-between align-items-center">
                    <h6 class="mb-0">${volunteer.ime} ${volunteer.primek}</h6>
                    ${volunteer.znacka ? `<span class="badge ${getBadgeClass(volunteer.znacka)}">${volunteer.znacka}</span>` : ''}
                </div>
                <small class="text-muted d-block">${volunteer.spretnost}</small>
                <div class="d-flex align-items-center mt-1">
                    <div class="me-3">
                        <small class="text-muted">Ure na projektu: ${volunteer.ure}</small>
                    </div>
                    <div>
                        <small class="text-muted">Skupne ure: ${volunteer.skupne_ure}</small>
                    </div>
                </div>
                ${volunteer.ocena ? `
                <div class="mt-1">
                    <small class="text-muted">Ocena: ${volunteer.ocena}/5</small>
                </div>
                ` : ''}
            </div>
        </li>
    `).join('');

    volunteersContainer.innerHTML = `
        <ul class="list-group list-group-flush">
            ${volunteersHTML}
        </ul>
    `;

}

function getBadgeClass(znacka) {
    const badges = {
        'Bronasti humanitarec': 'bg-bronze',
        'Srebrni humanitarec': 'bg-silver',
        'Zlati humanitarec': 'bg-gold',
        'Platinasti humanitarec': 'bg-platinum'
    };
    return badges[znacka] || 'bg-secondary';
}

function updateElementContent(elementId, content) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = content;
    }
}
function loadProjectEdit(data) {
    const editDiv = document.getElementById('upravljanjeProjektov');
    if(localStorage.getItem("drustvoId") == data.TK_Drustvo){
        editDiv.style.display = 'block';
        const editButton = document.getElementById('editBtn');
        if (editButton) {

            editButton.addEventListener('click', function(e) {
                e.preventDefault();
                window.location.href = `dodajanjeProjekta.html?id=${data.idProjekt}`;
            });
        const infoBtn = document.getElementById('infoBtn');
        if (infoBtn) {
            infoBtn.addEventListener('click', function(e) {
                e.preventDefault();
                window.location.href = `povratneInformacije.html?projektId=${data.idProjekt}`;
            });
        }
        
}
    }
    else{return}
}
// Posodobimo obstoječo DOMContentLoaded funkcijo
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');

    if (projectId) {
        loadProjectDetails(projectId);
        loadProjectVolunteers(projectId);
    }
    
    // Dodamo event listener za gumb prijave
    const volunteerBtn = document.getElementById('volunteer-btn-bottom');
    if (volunteerBtn) {
        volunteerBtn.addEventListener('click', prijaviSeNaProjekt);
    }
});

// Funkcija za prijavo na projekt
async function prijaviSeNaProjekt() {
    const prostovoljecId = localStorage.getItem('prostovoljecId');
    const projectId = new URLSearchParams(window.location.search).get('id');
    
    // Preverimo, če je prostovoljec prijavljen
    if (!prostovoljecId) {
        alert('Za prijavo na projekt se morate najprej prijaviti kot prostovoljec.');
        window.location.href = 'prijava.html';
        return;
    }
    
    if (!projectId) {
        alert('Napaka: ID projekta ni najden.');
        return;
    }
    
    try {
        const response = await fetch('/api/prijavaProjekt/projekt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prostovoljecId: prostovoljecId,
                projektId: projectId
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert('Uspešno ste se prijavili na projekt! Organizator bo preveril vašo prijavo.');
            // Ponovno naložimo podatke o prostovoljcih
            loadProjectVolunteers(projectId);
        } else {
            alert(result.error || 'Napaka pri prijavi na projekt.');
        }
    } catch (error) {
        console.error('Napaka:', error);
        alert('Prišlo je do napake pri prijavi. Poskusite znova.');
    }
}
