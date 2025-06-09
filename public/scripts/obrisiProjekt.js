
// Inicijalizacija pri učitavanju stranice
document.addEventListener('DOMContentLoaded', () => {
    // Pronalazi sve dugmad za brisanje projekta
    const deleteButtons = document.querySelectorAll('.delete-project-btn');
    
    // Dodaje event listener za svako dugme
    deleteButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            const projectId = button.dataset.projectId;
            await potvrdiBrisanjeProjekta(projectId);
        });
    });
});

// Funkcija za potvrdu i brisanje projekta
async function potvrdiBrisanjeProjekta(projectId) {
    // Provera da li je korisnik prijavljen kao društvo
    const drustvoId = localStorage.getItem('drustvoId');
    if (!drustvoId) {
        await Swal.fire({
            icon: 'error',
            title: 'Napaka',
            text: 'Morate biti prijavljeni kao društvo da biste obrisali projekat.',
            confirmButtonColor: 'var(--bs-main)',
            background: '#1a1a1a',
            color: '#fff',
            iconColor: 'var(--bs-main)'
        });
        return;
    }

    // Potvrda brisanja
    const potvrda = await Swal.fire({
        title: 'Ali ste prepričani?',
        text: 'Brisanje projekta je trajno in ni mogoče razveljaviti.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Da, izbriši',
        cancelButtonText: 'Prekliči',
        confirmButtonColor: 'var(--bs-main)',
        cancelButtonColor: '#6c757d',
        background: '#1a1a1a',
        color: '#fff',
        iconColor: 'var(--bs-main)',
        reverseButtons: true
    });

    if (!potvrda.isConfirmed) {
        return;
    }

    try {
        // Slanje zahteva za brisanje projekta
        console.log(`Brisanje projekta z ID: ${projectId} za društvo z ID: ${drustvoId}`);
        const response = await fetch(`/api/dodajanjeProjekta/${projectId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ drustvoId })
        });

        const result = await response.json();

        if (response.ok) {
            await Swal.fire({
                icon: 'success',
                title: 'Uspeh',
                text: 'Projekt je uspešno izbrisan.',
                confirmButtonColor: 'var(--bs-main)',
                background: '#1a1a1a',
                color: '#fff',
                iconColor: 'var(--bs-main)',
                timer: 2500,
                showConfirmButton: false
            });

            // Preusmeravanje na profil ili osvežavanje stranice
            window.location.href = 'profil.html';
        } else {
            throw new Error(result.error || 'Napaka pri brisanju projekta');
        }
    } catch (error) {
        console.error('Napaka pri brisanju projekta:', error);
        await Swal.fire({
            icon: 'error',
            title: 'Napaka',
            text: `Napaka pri brisanju projekta: ${error.message}`,
            confirmButtonColor: 'var(--bs-main)',
            background: '#1a1a1a',
            color: '#fff',
            iconColor: 'var(--bs-main)'
        });
    }
}
