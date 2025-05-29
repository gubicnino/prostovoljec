$(document).ready(function() {
    $("#header").load("header.html", function() {
        const isLoggedIn = localStorage.getItem('drustvoId') || localStorage.getItem('prostovoljecId');
        if (isLoggedIn) {
            document.getElementById("prijava").attributes["href"].value = "profil.html";
        }
        
        const currentPath = window.location.pathname;
        const currentPage = decodeURIComponent(currentPath.split('/').pop()) || 'index.html';
        
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            const link = item.querySelector('.nav-link');
            if (link) {
                const href = link.getAttribute('href');
                
                if (href === currentPage) {
                    item.classList.add('active');
                }
                else if (href === 'index.html' && (currentPage === '' || currentPage === 'index.html')) {
                    item.classList.add('active');
                }
                else if (href === 'našeZvezde.html' && currentPage === 'našeZvezde.html') {
                    item.classList.add('active');
                }
                else if ((href === 'profil.html' || (link.id === 'prijava' && isLoggedIn)) && currentPage === 'profil.html') {
                    item.classList.add('active');
                }
            }
        });
    });
    $("#footer").load("footer.html");
});