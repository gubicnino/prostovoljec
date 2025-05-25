function inicializirajPrijavo() {
    const loginModal = document.getElementById('loginModal');
    const closeLoginModal = document.getElementById('closeLoginModal');
    const loginForm = document.getElementById('loginForm');
    const togglePassword = document.getElementById('togglePassword');
    const passwordField = document.getElementById('loginPassword');
    const loginErrorDiv = document.getElementById('loginError');
    
    // Sepravi ce je prijvaljene se preusmere na profil, ce nejje se preusmere na login (loginModal je active)
    const isLoggedIn = localStorage.getItem('prijavljen') === "true" || localStorage.getItem('drustvoId') || localStorage.getItem('prostovoljecId');
    
    document.body.addEventListener('click', function(e) {
        if (e.target.matches('.user') || e.target.closest('#prijava')) {
            e.preventDefault();
            
            if (isLoggedIn) {
                window.location.href = "profil.html";
            } else if (loginModal) {
                loginModal.classList.add('active');
            }
        }
    }, { capture: true });
    
    if (closeLoginModal) {
        closeLoginModal.addEventListener('click', function() {
            loginModal.classList.remove('active');
        });
    }
    
    if (loginModal) {
        window.addEventListener('click', function(e) {
            if (e.target === loginModal) {
                loginModal.classList.remove('active');
            }
        });
    }
    // tu se spremeni ikona (OKA)
    if (togglePassword && passwordField) {
        togglePassword.addEventListener('click', function() {
            const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordField.setAttribute('type', type);
            
            const eyeIcon = togglePassword.querySelector('i');
            if (type === 'password') {
                eyeIcon.classList.remove('fa-eye-slash');
                eyeIcon.classList.add('fa-eye');
            } else {
                eyeIcon.classList.remove('fa-eye');
                eyeIcon.classList.add('fa-eye-slash');
            }
        });
    }
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;

            fetch("/prijava", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ username, password })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // tu se id samo shrane v LS>
                    if (data.user.drustvoId) {
                        localStorage.setItem("drustvoId", data.user.drustvoId);
                    } else if (data.user.prostovoljecId) {
                        localStorage.setItem("prostovoljecId", data.user.prostovoljecId);
                    }

                    localStorage.setItem("prijavljen", "true");
                    
                    loginModal.classList.remove('active');
                    window.location.reload();
                } else {
                    loginErrorDiv.style.display = 'block';
                    loginErrorDiv.textContent = data.error || 'Uporabniško ime ali geslo je napačno!';
                }
            })
            .catch(error => {
                console.error("Napaka pri prijavi:", error);
                loginErrorDiv.style.display = 'block';
                loginErrorDiv.textContent = 'Prišlo je do napake pri prijavi. Poskusite znova.';
            });
        });
    }
}

// tu se vse inicializera gda se naloži stran
document.addEventListener('DOMContentLoaded', function() {
    const isLoggedIn = localStorage.getItem('prijavljen') === "true" || localStorage.getItem('drustvoId') || localStorage.getItem('prostovoljecId');
    
    if (isLoggedIn) {
        const userIcon = document.querySelector('#prijava .user');
        if (userIcon) {
            userIcon.classList.add('logged-in');
        }
    }

    if (!isLoggedIn) {
        fetch('loginModal.html')
            .then(response => response.text())
            .then(html => {
                document.body.insertAdjacentHTML('beforeend', html);
                inicializirajPrijavo();
            })
            .catch(error => console.error('Napaka pri nalaganju login modala:', error));
    } else {
        inicializirajPrijavo();
    }
});