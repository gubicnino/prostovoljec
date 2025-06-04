document.addEventListener("DOMContentLoaded", function () {
    console.log("Skripta preveriPrijavo.js je naložena");

    const loginForm = document.getElementById("loginForm");
    const errorMessageDiv = document.getElementById("error-message"); // Usklajen ID

    if (!loginForm) {
        console.error("Element z ID 'loginForm' ni najden");
        return;
    }

    loginForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        console.log("Pošiljanje podatkov na strežnik...");
        fetch("/prijava", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
        })
            .then(response => response.json())
            .then(data => {
                console.log("Prejeti podatki:", data);
                if (data.success) {
                    // Shrani ID v localStorage
                    if (data.user.drustvoId) {
                        localStorage.setItem("drustvoId", data.user.drustvoId);
                    } else if (data.user.prostovoljecId) {
                        localStorage.setItem("prostovoljecId", data.user.prostovoljecId);
                    }

                    localStorage.setItem("prijavljen", "true");

                    window.location.href = "index.html";
                } else {
                    errorMessageDiv.style.display = 'block';
                    errorMessageDiv.textContent = data.error || 'Uporabniško ime ali geslo je napačno!';
                }
            })
            .catch(error => {
                console.error("Napaka pri prijavi:", error);
                errorMessageDiv.style.display = 'block';
                errorMessageDiv.textContent = 'Prišlo je do napake pri prijavi. Poskusite znova.';
            });
    });
});
