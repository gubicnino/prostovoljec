document.addEventListener("DOMContentLoaded", () => {
    const prostovoljecForm = document.forms["registerProstovoljec"];
    const drustvoForm = document.forms["registerDrustvo"];

    prostovoljecForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!prostovoljecForm.checkValidity()) return;

        const data = {
            ime: prostovoljecForm.ime.value,
            primek: prostovoljecForm.primek.value,
            telStevilka: prostovoljecForm.telStevilka.value,
            datumRojstva: prostovoljecForm.datumRojstva.value,
            email: prostovoljecForm.email.value,
            naslov: prostovoljecForm.naslov.value,
            username: prostovoljecForm.username.value,
            password: prostovoljecForm.password.value
        };

        try {
            const response = await fetch("/registracija/prostovoljec", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            alert(result.message);
        } catch (err) {
            alert("Napaka pri registraciji prostovoljca.");
        }
    });

    drustvoForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!drustvoForm.checkValidity()) return;

        const data = {
            naziv: drustvoForm.naziv.value,
            poslanstvo: drustvoForm.poslanstvo.value,
            naslov: drustvoForm.naslov.value,
            tipDrustva: drustvoForm.tipDrustva.value,
            telStevilka: drustvoForm.telStevilka.value,
            email: drustvoForm.email.value,
            steviloClanov: drustvoForm.steviloClanov.value,
            username: drustvoForm.username.value,
            password: drustvoForm.password.value
        };

        try {
            const response = await fetch("/registracija/drustvo", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            alert(result.message);
        } catch (err) {
            alert("Napaka pri registraciji društva.");
        }
    });
});
