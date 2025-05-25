$(document).ready(function() {
    $("#header").load("header.html", function() {
        const isLoggedIn = localStorage.getItem('drustvoId') || localStorage.getItem('prostovoljecId');
        if (isLoggedIn) {
            document.getElementById("prijava").attributes["href"].value = "profil.html";
        }
    });
    $("#footer").load("footer.html");
});