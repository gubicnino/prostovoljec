const e = require("express");

document.addEventListener("DOMContentLoaded", function() {
    console.log("Skripta preveriPrijavo.js je naložena");
    const loginForm = document.getElementById("loginForm");

    if(!loginForm) {
        console.error("Element z ID 'loginForm' ni najden");
        return;
    }

    // Preveri ali obrazec obstaja
    loginForm.addEventListener("submit", function(event) {
        event.preventDefault(); 
        
        const username = document.getElementById("username").value;
        console.log("Vneseno uporabniško ime:", username);
        const password = document.getElementById("password").value;
        console.log("Vneseno geslo:", password);

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
                sessionStorage.setItem('vpisaniUporabniki', JSON.stringify({
                    id: data.user.idUporabnik,
                    administrator: data.user.administrator
                }));
                sessionStorage.setItem('prijavljen', true);
                window.location.href = 'index.html'; // Preusmeri na domačo stran
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