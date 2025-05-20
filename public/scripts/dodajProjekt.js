document.addEventListener("DOMContentLoaded", () => {
    const projectForm = document.forms["addProject"];

    projectForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        e.stopPropagation();

        projectForm.classList.add("was-validated");

        if (!projectForm.checkValidity()) {
            console.log("Forma nije validna");
            return;
        }

        // Collect form data with server-expected field names
        const data = {
            naziv: projectForm.naziv.value,
            cilj: projectForm.cilj.value,
            datumIzvajanja: projectForm.datumIzvajanja.value,
            trajanje: projectForm.trajanje.value,
            tezavnost: projectForm.tezavnost.value,
            datumRokaPrijave: projectForm.datumRokaPrijave.value,
            lokacija: projectForm.Lokacija.value, // Changed to lowercase
            kratekOpis: projectForm.kratekOpis.value,
            opis: projectForm.opis.value // Changed to match server
        };

        try {
            console.log("Slanje POST zahteva na /api/dodajanjeProjekta", data);
            const response = await fetch("/api/dodajanjeProjekta", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                console.log("Uspešno dodat projekat", result);
                alert("Projekt je uspešno dodat!");
                window.location.href = "projekti.html";
            } else {
                console.log("Greška od servera:", response.status, result);
                alert(`Greška pri dodavanju projekta: ${result.error || result.message || "Neznana napaka"}`);
            }
        } catch (error) {
            console.error("Greška pri slanju zahteva:", error);
            alert("Greška pri povezivanju sa serverom.");
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