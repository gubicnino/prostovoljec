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

async function checkExistingApplication(prostovoljecId, projektId) {
    try {
        const response = await fetch(`/api/prijavaProjekt/check`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prostovoljecId, projektId })
        });
        const result = await response.json();
        return result.hasApplication;
    } catch (error) {
        console.error('Error checking application:', error);
        return false;
    }
}

function updateProjectDetails(data) {
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

    const zahteve = data.zahteve || '';
    const reqElement = document.getElementById('zahteve-list');
    const zahteveList = zahteve.split(',').map(req => req.trim()).filter(req => req).map(req => `<li class="list-group-item border-0 ps-0 d-flex align-items-center "><i class="fas fa-circle text-danger me-2"style="font-size: 0.5rem;"></i>${req}</li>`).join('');
    if (reqElement) {
        reqElement.innerHTML = zahteveList;
    }
    loadProjectEdit(data);

    // Update volunteer buttons logic
    const volunteerBtnContainer = document.getElementById('volunteer-btn-bottom');
    const volunteerBtnContainer2 = document.getElementById('volunteer-btn');
    if (volunteerBtnContainer) {
        const drustvoId = localStorage.getItem('drustvoId');
        
        // Če je prijavljen kot društvo, skrij cel container
        if (drustvoId) {
            volunteerBtnContainer.style.display = 'none';
            volunteerBtnContainer2.style.display = 'none';
            return;
        }

        const prostovoljecId = localStorage.getItem('prostovoljecId');
        if (prostovoljecId) {
            // First check for existing application
            checkExistingApplication(prostovoljecId, data.idProjekt).then(hasApplication => {
                if (hasApplication) {
                    volunteerBtnContainer.style.display = 'none';
                    volunteerBtnContainer2.style.display = 'none';
                    return;
                }
                
                fetch(`/api/projekti/${data.idProjekt}/volunteers`)
                    .then(r => r.json())
                    .then(volunteers => {
                        const isRegistered = volunteers.some(v => v.idProstovoljec.toString() === prostovoljecId);
                        
                        let buttonHtml = '';
                        if (isRegistered) {
                            buttonHtml = `
                                <button class="btn" onclick="odjavaIzProjekta(${prostovoljecId}, ${data.idProjekt})">
                                    <i class="fas fa-times me-2"></i>Odjava s projekta
                                </button>
                            `;
                        } else {
                            buttonHtml = `
                                <a class="btn" onclick="prijaviSeNaProjekt()">
                                    <i class="fas fa-hand-holding-heart me-2"></i>Prijava na projekt
                                </a>
                            `;
                        }
                        
                        volunteerBtnContainer.innerHTML = buttonHtml;
                        volunteerBtnContainer2.innerHTML = buttonHtml;
                        volunteerBtnContainer.style.display = 'block';
                        volunteerBtnContainer2.style.display = 'block';
                    });
            });
        } else {
            // If user is not logged in, show only signup button with login redirect
            volunteerBtnContainer.innerHTML = `
                <button class="btn btn-primary" onclick="redirectToLogin()">
                    <i class="fas fa-hand-holding-heart me-2"></i>Prijava na projekt
                </button>
            `;
        }
    }
}

function redirectToLogin() {
    Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'info',
        title: 'Za prijavo na projekt se morate najprej prijaviti kot prostovoljec.',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: '#1a1a1a',
        color: '#fff',
        iconColor: 'var(--bs-main)'
    }).then(() => {
        //window.location.href = 'prijava.html';
    });
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

    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    
    const volunteersHTML = volunteers.map(volunteer => {
        console.log('Volunteer object:', volunteer);
        return `
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
                ${shouldShowLogoutButton() ? `
                <div class="mt-2">
                    <button class="btn btn-sm btn-outline-danger" 
                            onclick="logoutVolunteer(${volunteer.idProstovoljec}, ${projectId})">
                        Odstrani prostovoljca
                    </button>
                </div>
                ` : ''}
            </div>
        </li>
        `;
    }).join('');

    volunteersContainer.innerHTML = `
        <ul class="list-group list-group-flush">
            ${volunteersHTML}
        </ul>
    `;
}

function shouldShowLogoutButton() {
    const drustvoId = localStorage.getItem('drustvoId');
    const editDiv = document.getElementById('upravljanjeProjektov');
    
    return drustvoId && editDiv && editDiv.style.display === 'block';
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

async function loadProjectEdit(data) {
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    const editDiv = document.getElementById('upravljanjeProjektov');
    const povratneInformacijeBtn = document.getElementById('infoBtn');
    if(localStorage.getItem("drustvoId") == data.TK_Drustvo){
        editDiv.style.display = 'block';
        const infoBtn = document.getElementById('infoBtn');
        const editButton = document.getElementById('editBtn');
        const aliProjektKoncan = await projektKoncan(projectId);
        console.log('Projekt končan:', projektKoncan);
        if (aliProjektKoncan) {
            infoBtn.style.display = 'block';
        }
        if (editButton) {
            editButton.addEventListener('click', function(e) {
                e.preventDefault();
                window.location.href = `dodajanjeProjekta.html?id=${data.idProjekt}`;
            });
        }
        if (infoBtn) {
            infoBtn.addEventListener('click', function(e) {
                e.preventDefault();
                window.location.href = `povratneInformacije.html?projektId=${data.idProjekt}`;
            });
        }
    }
}

async function projektKoncan(projectId) {
    try {
        const response = await fetch(`/api/projekti/${projectId}`);
        const data = await response.json();
        const currentDate = new Date();
        const projectEndDate = new Date(data.datumIzvajanja);
        
        return currentDate > projectEndDate;
    } catch (error) {
        console.error('Napaka pri preverjanju datuma:', error);
        return false;
    }
}
async function logoutVolunteer(prostovoljecId, projektId) {
    console.log('logoutVolunteer pozvan sa:', { prostovoljecId, projektId });

    if (!prostovoljecId || !projektId) {
        console.error('Nevalidni parametri:', { prostovoljecId, projektId });
        Swal.fire({
            icon: 'error',
            title: 'Napaka',
            text: 'Manjkajoči podatki za odjavo.',
            timer: 2500,
            showConfirmButton: false
        });
        return;
    }

    const drustvoId = localStorage.getItem('drustvoId');
    if (!drustvoId) {
        console.error('Nije pronađen drustvoId u localStorage.');
        Swal.fire({
            icon: 'error',
            title: 'Napaka',
            text: 'Niste prijavljeni kot društvo.',
            timer: 2500,
            showConfirmButton: false
        });
        return;
    }

    try {
        const response = await fetch(`/api/projekti/drustvo?id=${drustvoId}`);
        const projects = await response.json();
        const isAuthorized = projects.some(project => project.idProjekt === parseInt(projektId));

        if (!isAuthorized) {
            console.error('Neovlašćeni pokušaj odjave prostovoljca za projekat:', projektId);
            Swal.fire({
                icon: 'error',
                title: 'Napaka',
                text: 'Nimate dovoljenja za odstranjevanje prostovoljca s tega projekta.',
                timer: 2500,
                showConfirmButton: false
            });
            return;
        }
    } catch (error) {
        console.error('Napaka pri proveri projekata društva:', error);
        Swal.fire({
            icon: 'error',
            title: 'Napaka',
            text: 'Napaka pri preverjanju pooblastil. Poskusite znova.',
            timer: 2500,
            showConfirmButton: false
        });
        return;
    }

    const potrditev = await Swal.fire({
        title: 'Ali ste prepričani?',
        text: 'Ali želite odjaviti tega prostovoljca s projekta?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Da',
        cancelButtonText: 'Ne'
    });

    if (!potrditev.isConfirmed) {
        return;
    }

    try {
        const response = await fetch('/api/prijavaProjekt/projekt', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prostovoljecId: parseInt(prostovoljecId),
                projektId: parseInt(projektId)
            })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            Swal.fire({
                icon: 'success',
                title: 'Uspeh',
                text: 'Prostovoljec uspešno odjavljen s projekta.',
                timer: 2500,
                showConfirmButton: false
            });
            await Promise.all([
                loadProjectVolunteers(projektId),
                loadProjectDetails(projektId)
            ]);
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Napaka',
                text: result.message || 'Napaka pri odjavi prostovoljca.',
                timer: 2500,
                showConfirmButton: false
            });
        }
    } catch (error) {
        console.error('Napaka pri odjavi:', error);
        Swal.fire({
            icon: 'error',
            title: 'Napaka',
            text: 'Prišlo je do napake pri odjavi. Poskusite znova.',
            timer: 2500,
            showConfirmButton: false
        });
    }
}

async function prijaviSeNaProjekt() {
    const prostovoljecId = localStorage.getItem('prostovoljecId');
    const projectId = new URLSearchParams(window.location.search).get('id');
    
    if (!prostovoljecId) {
        await Swal.fire({
            icon: 'warning',
            title: 'Prijava potrebna',
            text: 'Za prijavo na projekt se morate najprej prijaviti kot prostovoljec.',
            confirmButtonText: 'V redu',
            confirmButtonColor: '#3085d6'
        });
        window.location.href = 'prijava.html';
        return;
    }
    
    if (!projectId) {
        Swal.fire({
            icon: 'error',
            title: 'Napaka',
            text: 'ID projekta ni bil najden. Prosimo, poskusite znova.',
            timer: 2500,
            showConfirmButton: false
        });
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
            await Swal.fire({
                icon: 'success',
                title: 'Prijava uspešna!',
                text: 'Organizator bo preveril vašo prijavo.',
                timer: 3000,
                showConfirmButton: false
            });
            const volunteerBtnContainer = document.getElementById('volunteer-btn-bottom');
            const volunteerBtnContainer2 = document.getElementById('volunteer-btn');
            if (volunteerBtnContainer || volunteerBtnContainer2) {
                volunteerBtnContainer.style.display = 'none';
                volunteerBtnContainer2.style.display = 'none';
            }
            
            loadProjectVolunteers(projectId);
        } else if (result.message && result.message.includes('že poslali prijavo')) {
            const volunteerBtnContainer = document.getElementById('volunteer-btn-bottom');
            const volunteerBtnContainer2 = document.getElementById('volunteer-btn');
            if (volunteerBtnContainer || volunteerBtnContainer2) {
                volunteerBtnContainer.style.display = 'none';
                volunteerBtnContainer2.style.display = 'none';
            }
            
            Swal.fire({
                icon: 'error',
                title: 'Napaka',
                text: result.message,
                timer: 3000,
                showConfirmButton: false
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Napaka',
                text: result.message || 'Napaka pri prijavi na projekt.',
                timer: 3000,
                showConfirmButton: false
            });
        }
    } catch (error) {
        console.error('Napaka:', error);
        Swal.fire({
            icon: 'error',
            title: 'Napaka',
            text: 'Prišlo je do napake pri prijavi. Poskusite znova.',
            timer: 3000,
            showConfirmButton: false
        });
    }
}

async function odjavaIzProjekta(prostovoljecId, projektId) {
    const { isConfirmed } = await Swal.fire({
        title: 'Potrditev odjave',
        text: 'Ali ste prepričani, da se želite odjaviti s tega projekta?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Da, odjavi me',
        cancelButtonText: 'Prekliči',
        background: '#1a1a1a',
        color: '#fff',
        iconColor: 'var(--bs-main)',
        confirmButtonColor: 'var(--bs-main)',
        cancelButtonColor: '#888',
        reverseButtons: true
    });

    if (!isConfirmed) {
        return;
    }

    try {
        const response = await fetch('/api/prijavaProjekt/projekt', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prostovoljecId: parseInt(prostovoljecId),
                projektId: parseInt(projektId)
            })
        });

        const result = await response.json();

        if (response.ok && result.success) {
            await Swal.fire({
                icon: 'success',
                title: 'Odjava uspešna',
                text: 'Uspešno ste se odjavili s projekta.',
                timer: 2500,
                showConfirmButton: false,
                background: '#1a1a1a',
                color: '#fff',
                iconColor: 'var(--bs-main)',
            });
            window.location.href = 'projekti.html';
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Napaka',
                text: result.message || 'Napaka pri odjavi s projekta.',
                background: '#1a1a1a',
                color: '#fff',
                iconColor: 'var(--bs-main)',
            });
        }
    } catch (error) {
        console.error('Napaka pri odjavi:', error);
        Swal.fire({
            icon: 'error',
            title: 'Napaka',
            text: 'Prišlo je do napake pri odjavi. Poskusite znova.',
            background: '#1a1a1a',
            color: '#fff',
            iconColor: 'var(--bs-main)',
        });
    }
}