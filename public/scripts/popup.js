$(document).ready(function() {
    $("#header").load("header.html", function() {
        // Kreiraj popup div nakon što je header učitan
        var popupDiv = document.createElement('div');
        popupDiv.setAttribute('id', 'loginPopup');
        popupDiv.innerHTML = `
            <div class="login-popup">
                <button class="closeBtn" onclick="sakrijPopup()">&times;</button>
                <h2>Prijavi se</h2>
                <div id="error-message" style="display: none; color: red; margin-bottom: 15px;"></div>
                <form id="loginForm" class="login-form needs-validation" name="login" method="post" novalidate>
                    <div class="mb-3">
                        <label for="username" class="form-label">Korisničko ime</label>
                        <input type="text" id="username" name="username" class="form-control"
                            placeholder="Unesite korisničko ime" required>
                        <div class="invalid-feedback">Molimo, unesite korisničko ime.</div>
                    </div>
                    <div class="mb-4">
                        <label for="password" class="form-label">Lozinka</label>
                        <input type="password" id="password" name="password" class="form-control"
                            placeholder="Unesite lozinku" required>
                        <div class="invalid-feedback">Molimo, unesite lozinku.</div>
                    </div>
                    <button type="submit" class="btn btn-primary">Prijava</button>
                    <button type="reset" class="btn btn-secondary mx-3">Poništi</button>
                </form>
                <p><a href="registracija.html">Registruj se</a></p>
            </div>
        `;
        document.body.appendChild(popupDiv);

        // Proveri status ulogovanog korisnika
        const isLoggedIn = localStorage.getItem('drustvoId') || localStorage.getItem('prostovoljecId');
        if (isLoggedIn) {
            var prijavaLink = document.getElementById("prijava");
            if (prijavaLink) {
                prijavaLink.setAttribute("href", "profil.html");
            }
        }

        // Obrada prijave iz forme
        const loginForm = document.getElementById("loginForm");
        const errorMessageDiv = document.getElementById("error-message");

        if (!loginForm) {
            console.error("Element sa ID 'loginForm' nije pronađen");
            return;
        }

        loginForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;

            console.log("Slanje podataka na server...");
            fetch("/prijava", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, password })
            })
                .then(response => response.json())
                .then(data => {
                    console.log("Primljeni podaci:", data);
                    if (data.success) {
                        // Shrani ID u localStorage
                        if (data.user.drustvoId) {
                            localStorage.setItem("drustvoId", data.user.drustvoId);
                        } else if (data.user.prostovoljecId) {
                            localStorage.setItem("prostovoljecId", data.user.prostovoljecId);
                        }

                        localStorage.setItem("prijavljen", "true");
                        sakrijPopup(); // Zatvori popup nakon uspešne prijave
                        window.location.href = "index.html";
                    } else {
                        errorMessageDiv.style.display = 'block';
                        errorMessageDiv.textContent = data.error || 'Korisničko ime ili lozinka je pogrešno!';
                    }
                })
                .catch(error => {
                    console.error("Greška pri prijavi:", error);
                    errorMessageDiv.style.display = 'block';
                    errorMessageDiv.textContent = 'Došlo je do greške pri prijavi. Pokušajte ponovo.';
                });
        });
    });

    $("#footer").load("footer.html");
});

window.prikaziPopup = function() {
    var popup = document.getElementById('loginPopup');
    if (popup) {
        popup.style.display = 'flex';
        // Resetuj formu i poruku o grešci prilikom otvaranja popup-a
        const loginForm = document.getElementById("loginForm");
        const errorMessageDiv = document.getElementById("error-message");
        if (loginForm) loginForm.reset();
        if (errorMessageDiv) {
            errorMessageDiv.style.display = 'none';
            errorMessageDiv.textContent = '';
        }
    } else {
        console.error('Popup element nije pronađen!');
    }
};

window.sakrijPopup = function() {
    var popup = document.getElementById('loginPopup');
    if (popup) {
        popup.style.display = 'none';
    }
};