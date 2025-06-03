document.addEventListener("DOMContentLoaded", () => {
    FilePond.registerPlugin(
        FilePondPluginImagePreview,
        FilePondPluginImageExifOrientation,
        FilePondPluginFileValidateSize,
        FilePondPluginImageEdit
    );

    window.pond = FilePond.create(document.getElementById('filepondImg'), {
        allowMultiple: false,
        maxFiles: 1,
        maxFileSize: '3MB',
        acceptedFileTypes: ['image/*'],
        labelIdle: 'Povlecite datoteko ali <span class="filepond--label-action">Izberite datoteko</span>',
        labelFileProcessingError: 'Napaka pri obdelavi datoteke',
        storeAsFile: true,
    });
    const projectForm = document.forms["addProject"];
    const TK_Drustvo = localStorage.getItem("drustvoId");
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get('id');
    if (projectId) {
        nastaviProjekt(projectId);
    }

    projectForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        e.stopPropagation();

        projectForm.classList.add("was-validated");

        if (!projectForm.checkValidity()) {
            console.log("Forma nije validna");
            return;
        }
        let uploadedImagePath = null;
        if (window.pond && window.pond.getFiles().length > 0) {
            const file = window.pond.getFiles()[0].file;
            try {
                const formData = new FormData();
                formData.append('slika', file);
                console.log(formData);
                const uploadResponse = await fetch('/api/upload/projekt', {
                    method: 'POST',
                    body: formData
                });

                const uploadResult = await uploadResponse.json();

                if (uploadResponse.ok) {
                    uploadedImagePath = uploadResult.path;
                } else {
                    throw new Error(uploadResult.error || 'Napaka pri uploadu slike');
                }
            } catch (error) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Napaka pri uploadu slike',
                    text: error.message,
                    confirmButtonColor: 'var(--bs-main)',
                    background: '#1a1a1a',
                    color: '#fff'
                });
                return;
            }
        }

        const data = {
            naziv: projectForm.naziv.value,
            cilj: projectForm.cilj.value,
            datumIzvajanja: projectForm.datumIzvajanja.value,
            trajanje: projectForm.trajanje.value,
            tezavnost: projectForm.tezavnost.value,
            datumRokaPrijave: projectForm.datumRokaPrijave.value,
            lokacija: projectForm.Lokacija.value,
            kratekOpis: projectForm.kratekOpis.value,
            opis: projectForm.opis.value,
            kapaciteta: projectForm.kapaciteta.value,
            TK_Drustvo: TK_Drustvo,
            zahteve: projectForm.zahteve.value,
            slika: uploadedImagePath || null
        };
        console.log("Podatki projekta:", data);

        let url = "/api/dodajanjeProjekta";
        if (projectId) {
            url += "/urejanje";
            data.idProjekt = projectId;
        }

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Uspeh',
                    text: 'Projekt je uspešno dodan!',
                    confirmButtonColor: 'var(--bs-main)',
                    background: '#1a1a1a',
                    color: '#fff',
                    iconColor: 'var(--bs-main)'
                });
                window.location.href = "profil.html";
            } else {
                await Swal.fire({
                    icon: 'error',
                    title: 'Napaka',
                    text: `Napaka pri dodajanju projekta: ${result.error || result.message || "Neznana napaka"}`,
                    confirmButtonColor: 'var(--bs-main)',
                    background: '#1a1a1a',
                    color: '#fff',
                    iconColor: 'var(--bs-main)'
                });
            }
        } catch (error) {
            await Swal.fire({
                icon: 'error',
                title: 'Napaka',
                text: 'Napaka pri povezovanju s serverjem.',
                confirmButtonColor: 'var(--bs-main)',
                background: '#1a1a1a',
                color: '#fff',
                iconColor: 'var(--bs-main)'
            });
        }
    });
    // Set minimum date for date inputs
    const today = new Date().toISOString().split("T")[0];
    const datumIzvajanja = document.getElementById("datumIzvajanja");
    const datumRokaPrijave = document.getElementById("datumRokaPrijave");

    if (datumIzvajanja) datumIzvajanja.setAttribute("min", today);
    if (datumRokaPrijave) datumRokaPrijave.setAttribute("min", today);

    // Validate that rokPrijave is before datumIzvajanja
    datumIzvajanja?.addEventListener("change", function () {
        const izvajanje = this.value;
        const rokPrijave = datumRokaPrijave?.value;

        if (rokPrijave && new Date(rokPrijave) >= new Date(izvajanje)) {
            datumRokaPrijave?.setCustomValidity("Rok prijave mora biti pred datumom izvajanja");
        } else {
            datumRokaPrijave?.setCustomValidity("");
        }
    });

    datumRokaPrijave?.addEventListener("change", function () {
        const rokPrijave = this.value;
        const izvajanje = datumIzvajanja?.value;

        if (izvajanje && new Date(rokPrijave) >= new Date(izvajanje)) {
            this.setCustomValidity("Rok prijave mora biti pred datumom izvajanja");
        } else {
            this.setCustomValidity("");
        }
    });
});


function nastaviProjekt(projectId) {
    const naslov = document.getElementById("naslov");
    naslov.innerHTML = "Spreminjanje projekta";
    const dodajBtn = document.getElementById("dodajBtn");
    dodajBtn.innerHTML = "Spremeni projekt";
    fetch(`/api/projekti/${projectId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Napaka pri nalaganju projekta');
            }
            return response.json();
        })
        .then(data => {
            const form = document.forms["addProject"];
            form.naziv.value = data.naziv;
            form.cilj.value = data.cilj;
            form.datumIzvajanja.value = data.datumIzvajanja.split("T")[0];
            form.trajanje.value = data.trajanje;
            form.tezavnost.value = data.tezavnost;
            form.datumRokaPrijave.value = data.datumRokaPrijave.split("T")[0];
            form.Lokacija.value = data.Lokacija;
            form.kratekOpis.value = data.kratekOpis;
            form.opis.value = data.opis;
            form.kapaciteta.value = data.kapaciteta;
            form.zahteve.value = data.zahteve;

        })
        .catch(error => {
            console.error('Napaka pri nalaganju projekta:', error);
        });
}
function nalaganjeSlik() {

}
