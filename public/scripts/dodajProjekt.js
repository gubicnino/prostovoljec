// Validacija obrazca i pošiljanje podatkov
(function () {
    'use strict';
    console.log('dodajProjekt.js učitan'); // Debug: Provera učitavanja skripte

    const forms = document.querySelectorAll('.needs-validation');
    console.log('Pronađene forme:', forms.length); // Debug: Provera broja formi

    Array.from(forms).forEach(function (form) {
        console.log('Registracija submit događaja na formi'); // Debug
        form.addEventListener('submit', async function (event) {
            console.log('Submit događaj aktiviran'); // Debug: Provera da li submit radi
            event.preventDefault(); // Sprečava podrazumevano ponašanje forme
            event.stopPropagation();

            if (!form.checkValidity()) {
                console.log('Forma nije validna'); // Debug
                form.classList.add('was-validated');
                return;
            }

            try {
                console.log('Slanje POST zahteva na /dodajanjeProjekta'); // Debug
                const formData = new FormData(form);
                const response = await fetch('/api/dodajanjeProjekta', {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    console.log('Uspešno dodat projekat'); // Debug
                    alert('Projekt je uspešno dodat!');
                    window.location.href = 'projekti.html'; // Preusmerava na stranu sa projektima
                } else {
                    console.log('Greška od servera:', response.status); // Debug
                    alert('Greška pri dodavanju projekta. Pokušajte ponovo.');
                }
            } catch (error) {
                console.error('Greška pri slanju zahteva:', error); // Debug
                alert('Greška pri povezivanju sa serverom.');
            }

            form.classList.add('was-validated');
        }, false);
    });
})();

// Nastavi minimalni datum za datume
const today = new Date().toISOString().split('T')[0];
document.getElementById('datumIzvajanja')?.setAttribute('min', today);
document.getElementById('datumRokaPrijave')?.setAttribute('min', today);

// Proveri da je rok prijave pre datuma izvršenja
document.getElementById('datumIzvajanja')?.addEventListener('change', function() {
    const izvajanje = this.value;
    const rokPrijave = document.getElementById('datumRokaPrijave')?.value;
    
    if (rokPrijave && new Date(rokPrijave) >= new Date(izvajanje)) {
        document.getElementById('datumRokaPrijave')?.setCustomValidity('Rok prijave mora biti pred datumom izvajanja');
    } else {
        document.getElementById('datumRokaPrijave')?.setCustomValidity('');
    }
});

document.getElementById('datumRokaPrijave')?.addEventListener('change', function() {
    const rokPrijave = this.value;
    const izvajanje = document.getElementById('datumIzvajanja')?.value;
    
    if (izvajanje && new Date(rokPrijave) >= new Date(izvajanje)) {
        this.setCustomValidity('Rok prijave mora biti pred datumom izvajanja');
    } else {
        this.setCustomValidity('');
    }
});