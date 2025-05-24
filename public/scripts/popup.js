$(document).ready(function() {
    $("#header").load("header.html", function() {
        // Kreiraj popup div nakon što je header učitan
        var popupDiv = document.createElement('div');
        popupDiv.setAttribute('id', 'loginPopup');
        popupDiv.innerHTML = `
            <div class="login-popup">
                <button onclick="sakrijPopup()">Zapri</button>
                <h2>Prijavi se</h2>
                <form id="loginForm" class="login-form needs-validation" name="login" method="post" novalidate>
                    <div class="mb-3">
                        <label for="username" class="form-label">Uporabniško ime</label>
                        <input type="text" id="username" name="username" class="form-control"
                            placeholder="Vnesite uporabniško ime" required>
                        <div class="invalid-feedback">Prosimo, vnesite uporabniško ime.</div>
                    </div>
                    <div class="mb-4">
                        <label for="password" class="form-label">Geslo</label>
                        <input type="password" id="password" name="password" class="form-control"
                            placeholder="Vnesite geslo" required>
                        <div class="invalid-feedback">Prosimo, vnesite geslo.</div>
                    </div>
                    <button type="submit" class="btn btn-primary">Prijava</button>
                    <button type="reset" class="btn btn-secondary mx-3">Ponastavi</button>
                </form>
                <p><a href="registracija.html">Registruj se</a></p>
            </div>
        `;
        document.body.appendChild(popupDiv);

        // Proveri status prijavljenog korisnika
        const isLoggedIn = localStorage.getItem('drustvoId') || localStorage.getItem('prostovoljecId');
        if (isLoggedIn) {
            var prijavaLink = document.getElementById("prijava");
            if (prijavaLink) {
                prijavaLink.setAttribute("href", "profil.html");
            }
        }
    });

    $("#footer").load("footer.html");
});

window.prikaziPopup = function() {
    var popup = document.getElementById('loginPopup');
    if (popup) {
        popup.style.display = 'block';
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