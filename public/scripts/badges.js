const BadgeSystem = {
    /**
     * @param {number} hours - URE
     * @return {Object} - VSI PODATKE (ime, ikona, barva, razred, mejne vrednosti)
     */
    getBadgeInfo: function(hours) {
        if (hours >= 1000) {
        return {
            name: "Platinasti humanitarec",
            icon: "fa-medal",
            color: "#373c43",
            textClass: "text-light",
            bgClass: "bg-platinum",
            minHours: 1000,
            maxHours: null
        };
        } else if (hours >= 100) {
        return {
            name: "Zlati humanitarec",
            icon: "fa-medal",
            color: "#ffc107",
            textClass: "text-warning",
            bgClass: "bg-warning",
            minHours: 100,
            maxHours: 999
        };
        } else if (hours >= 50) {
        return {
            name: "Srebrni humanitarec",
            icon: "fa-medal",
            color: "#adb5bd",
            textClass: "text-secondary",
            bgClass: "bg-secondary",
            minHours: 50,
            maxHours: 99
        };
        } else if (hours >= 10) {
        return {
            name: "Bronasti humanitarec",
            icon: "fa-medal",
            color: "#cd7f32",
            textClass: "text-bronze",
            bgClass: "bg-bronze",
            minHours: 10,
            maxHours: 49
        };
        } else {
        return {
            name: "Začetnik",
            icon: "fa-star",
            color: "#6c757d",
            textClass: "text-muted",
            bgClass: "bg-light",
            minHours: 0,
            maxHours: 9
        };
        }
    },

    /**
     * HTML ZA ZNACKO
     * @param {number} hours - URE
     * @param {string} style - STILI
     * @return {string} - HTML
     */
    createBadgeHTML: function(hours, style = 'pill') {
        const badge = this.getBadgeInfo(hours);
        
        // Tu se slede lejko doda se vec stilov za znacko glede na to kaj bomo rabili, te se uporabi samo switch-case type shit za vsake stil znacke
        return `
        <div class="badge text-white py-2 px-3 diagonalCorner" style="background-color: ${badge.color}">
            <i class="fas ${badge.icon} me-2"></i>
            <span>${badge.name}</span>
        </div>
        `;
    },
    
    initStyles: function() {
        if (!document.getElementById('badge-system-styles')) {
        const style = document.createElement('style');
        style.id = 'badge-system-styles';
        style.textContent = `
            .text-bronze { color: #cd7f32 !important; }
            .bg-bronze { background-color: #cd7f32 !important; }
            .bg-platinum { background-color: #373c43 !important; }
        `;
        document.head.appendChild(style);
        }
    },
};

document.addEventListener('DOMContentLoaded', function() {
    BadgeSystem.initStyles();
});