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
                // Dodaj še druga polja po potrebi
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
                document.getElementById('spretnost').value = data.spretnost || '';
                document.getElementById('opravljeneUre').textContent = data.opravljeneUre || '0';
                document.getElementById('znacka').textContent = data.znacka || 'Brez značke';
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
                alert('Spremembe so bile shranjene.');
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
                alert('Spremembe so bile shranjene.');
                window.location.reload();
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
});