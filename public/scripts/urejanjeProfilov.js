function loadCorrectProfiles() {
    document.querySelectorAll('.profile-page').forEach(el => el.style.display = 'none');
    const drustvoId = localStorage.getItem('drustvoId');
    const prostovoljecId = localStorage.getItem('prostovoljecId');

    if (drustvoId) {
        document.querySelector('.role-drustvo').style.display = 'block';
        fetch('/api/profil/drustvo?id=' + drustvoId)
            .then(response => response.json())
            .then(data => {
                console.log(data);
                const naziv = document.getElementById('naziv').value = data.naziv || '';
                const lokacija = document.getElementById('lokacija').value = data.naslov || '';
                const poslanstvo = document.getElementById('poslanstvo').value = data.poslanstvo || '';
                const usernameDrustva = document.getElementById('usernameDrustva').value = data.username || '';
                const passwordDrustva = document.getElementById('passwordDrustva').value = data.password || '';
                const telStevilkaDrustva = document.getElementById('telStevilkaDrustva').value = data.telStevilka || '';
                const emailDrustva = document.getElementById('emailDrustva').value = data.email || '';
                const tipDrustva = document.getElementById('tipDrustva').value = data.tipDrustva || '';
                const steviloClanov = document.getElementById('steviloClanov').value = data.steviloClanov || '';
                
                // Naložimo prijavnice
                naložiPrijavnice(drustvoId);
            });

    } else if (prostovoljecId) {
        document.querySelector('.role-prostovoljec').style.display = 'block';
        fetch('/api/profil/prostovoljec?id=' + prostovoljecId)
            .then(response => response.json())
            .then(data => {
                document.getElementById('username').value = data.username || '';
                document.getElementById('password').value = data.password || '';
                document.getElementById('ime').value = data.ime || '';
                document.getElementById('primek').value = data.primek || '';
                document.getElementById('telStevilka').value = data.telStevilka || '';
                document.getElementById('datumRojstva').value = data.datumRojstva ? data.datumRojstva.substring(0, 10) : '';
                document.getElementById('email').value = data.email || '';
                document.getElementById('naslov').value = data.naslov || '';
                const badge = BadgeSystem.getBadgeInfo(data.opravljeneUre || 0);
                document.getElementById('opravljeneUre').innerHTML = `
                                    <div class="d-flex align-items-center p-2 rounded">
                                        <div class="me-3">
                                            <i class="fas fa-clock" style="color: ${badge.color}"></i>
                                        </div>
                                        <div>
                                            <h5 class="mb-0 fw-bold" style="color: var(--bs-white)">${data.opravljeneUre} ur</h5>
                                        </div>
                                    </div>
                                    `;
                document.getElementById('znacka').innerHTML = BadgeSystem.createBadgeHTML(data.opravljeneUre || 0);
            });
    }
}

// Funkcija za nalaganje prijavnic
function naložiPrijavnice(drustvoId) {
    fetch(`/api/profil/prijavnice?drustvoId=${drustvoId}`)
        .then(response => response.json())
        .then(data => {
            const tabelaBody = document.querySelector('#prijavnice tbody');
            if (!tabelaBody) return;
            
            if (data.length === 0) {
                tabelaBody.innerHTML = `
                    <tr>
                        <td colspan="4" class="text-center text-white">
                            Trenutno ni novih prijavnic.
                        </td>
                    </tr>
                `;
                return;
            }
            
            const prijavniceHTML = data.map(prijava => `
                <tr>
                    <td>
                        <div>
                            <strong>${prijava.ime} ${prijava.primek}</strong><br>
                            <small class="text-white">${prijava.email}</small><br>
                            <small class="text-white">${prijava.telStevilka}</small>
                        </div>
                    </td>
                    <td>${prijava.projekt_naziv}</td>
                    <td>${new Date(prijava.datumPrijave).toLocaleDateString('sl-SI')}</td>
                    <td>
                        <button class="btn btn-success btn-sm me-2" onclick="potrdiPrijavo('${prijava.prijavId}', true)">
                            <i class="fas fa-check me-1"></i> Sprejmi
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="potrdiPrijavo('${prijava.prijavId}', false)">
                            <i class="fas fa-times me-1"></i> Zavrni
                        </button>
                    </td>
                </tr>
            `).join('');
            
            tabelaBody.innerHTML = prijavniceHTML;
        })
        .catch(error => {
            console.error('Napaka pri nalaganju prijavnic:', error);
        });
}

// Funkcija za potrditev/zavrnitev prijave
async function potrdiPrijavo(prijavId, odobreno) {

    try {
        const response = await fetch('/api/profil/potrditev-prijave', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prijavId: prijavId,
                odobreno: odobreno
            })
        });

        const data = await response.json();

        if (response.ok) {
             Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: data.message,
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                background: '#1a1a1a',
                color: '#fff',
                iconColor: 'var(--bs-main)'
            });
            naložiPrijavnice(localStorage.getItem('drustvoId')); // Refresh prijavnice
        } else {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'error',
                title: data.error || 'Napaka pri obdelavi prijave',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                background: '#1a1a1a',
                color: '#fff',
                iconColor: 'var(--bs-main)'
            });
        }
    } catch (error) {
        console.error('Napaka:', error);
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: 'Prišlo je do napake pri obdelavi prijave',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            background: '#1a1a1a',
            color: '#fff',
            iconColor: 'var(--bs-main)'
        });
    }
}

function omogociUredi() {
    // Za društvo
    document.querySelector('#formDrustvo .shraniSpremembe').style.display = 'inline-block';
    document.querySelector('#formDrustvo .urediBtn').style.display = 'none';

    // Za prostovoljca
    document.querySelector('#formProstovoljec .shraniSpremembe').style.display = 'inline-block';
    document.querySelector('#formProstovoljec .urediBtn').style.display = 'none';
    // drustvo
    document.querySelectorAll('#formDrustvo input, #formDrustvo textarea, #formDrustvo select').forEach(el => el.disabled = false);


    // Prostovoljec
    document.querySelectorAll('#formProstovoljec input, #formProstovoljec select').forEach(el => el.disabled = false);

}

function narediOdjavo() {
    if(localStorage.getItem('drustvoId')) {
        localStorage.removeItem('drustvoId');
    }
    if(localStorage.getItem('prostovoljecId')) {
        localStorage.removeItem('prostovoljecId');
    }
    window.location.href = '/';
    localStorage.setItem('prijavljen', 'false');
}

function shraniSpremembe() {
    const drustvoId = localStorage.getItem('drustvoId');
    const prostovoljecId = localStorage.getItem('prostovoljecId');

    if (drustvoId) {
        const naziv = document.getElementById('naziv').value;
        const lokacija = document.getElementById('lokacija').value;
        const poslanstvo = document.getElementById('poslanstvo').value;
        const usernameDrustva = document.getElementById('usernameDrustva').value;
        const passwordDrustva = document.getElementById('passwordDrustva').value;
        const telStevilkaDrustva = document.getElementById('telStevilkaDrustva').value;
        const emailDrustva = document.getElementById('emailDrustva').value;
        const tipDrustva = document.getElementById('tipDrustva').value;

        fetch('/api/profil/drustvoShrani', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: drustvoId, naziv, lokacija, poslanstvo, usernameDrustva, passwordDrustva, telStevilkaDrustva, emailDrustva, tipDrustva })
        })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'Spremembe so bile shranjene.',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                    background: '#1a1a1a',
                    color: '#fff',
                    iconColor: 'var(--bs-main)'
                });
            });
    } else if (prostovoljecId) {
        const ime = document.getElementById('ime').value;
        const primek = document.getElementById('primek').value;
        const telStevilka = document.getElementById('telStevilka').value;
        const datumRojstva = document.getElementById('datumRojstva').value;
        const email = document.getElementById('email').value;
        const naslov = document.getElementById('naslov').value;
        const spretnost = document.getElementById('spretnost').value;
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        fetch('/api/profil/prostovoljecShrani', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: prostovoljecId,
                ime,
                primek,
                telStevilka,
                datumRojstva,
                email,
                naslov,
                spretnost,
                username,
                password
            })
        })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'Spremembe so bile shranjene.',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                    background: '#1a1a1a',
                    color: '#fff',
                    iconColor: 'var(--bs-main)'
                });

                // počakaj, da se toast zapre, nato reload
                setTimeout(() => {
                    window.location.reload();
                }, 3100);
            });
    }
    document.querySelector('#formDrustvo .urediBtn').style.display = 'inline-block';
    document.querySelector('#formDrustvo .shraniSpremembe').style.display = 'none';

    // Za prostovoljca
    document.querySelector('#formProstovoljec .shraniSpremembe').style.display = 'none';
    document.querySelector('#formProstovoljec .urediBtn').style.display = 'inline-block';
    // drustvo
    document.querySelectorAll('#formDrustvo input, #formDrustvo textarea, #formDrustvo select').forEach(el => el.disabled = true);

    // Prostovoljec
    document.querySelectorAll('#formProstovoljec input, #formProstovoljec select').forEach(el => el.disabled = true);
}

document.addEventListener('DOMContentLoaded', () => {
    //localStorage.setItem('drustvoId', 1);
    //localStorage.setItem('prostovoljecId', 1);
    loadCorrectProfiles();
    
    document.getElementById('formDrustvo').addEventListener('submit', (e) => {
        e.preventDefault();
        shraniSpremembe();
    });
    
    document.getElementById('formProstovoljec').addEventListener('submit', (e) => {
        e.preventDefault();
        shraniSpremembe();
    });
    
    // Dodamo listener za tab prijavnic
    const prijavniceTab = document.getElementById('prijavnice-tab');
    if (prijavniceTab) {
        prijavniceTab.addEventListener('click', function() {
            const drustvoId = localStorage.getItem('drustvoId');
            if (drustvoId) {
                setTimeout(() => naložiPrijavnice(drustvoId), 100);
            }
        });
    }
});