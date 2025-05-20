var express = require("express");
var router = express.Router();
var connection = require("../db/database");

router.get("/", function (req, res, next) {
    console.log("Fetching all projects");
    const query = `
    SELECT p.idProjekt, p.naziv, p.cilj, p.datumIzvajanja, p.trajanje, p.tezavnost, p.datumRokaPrijave, p.Lokacija, p.kratekOpis, p.opis, d.naziv as drustvo_naziv
    FROM Projekt p
    LEFT JOIN Drustvo d ON p.TK_Drustvo = d.idDrustvo
    `;

    connection.query(query, function (err, results) {
    if (err) {
        console.error("Error fetching projects:", err);
        return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
    console.log("Fetched all projects");
    });
});

router.get('/drustvo', (req, res) => {
    const drustvoId = req.query.id;
    console.log("Fetching projects for drustvo z id: " + drustvoId);
    if (!drustvoId) return res.status(400).json({ error: 'Manjka id društva' });

    const query = `
        SELECT p.idProjekt, p.naziv, p.cilj, p.datumIzvajanja, p.trajanje, p.tezavnost, p.datumRokaPrijave, p.Lokacija, p.kratekOpis, p.opis, d.naziv as drustvo_naziv
        FROM Projekt p
        LEFT JOIN Drustvo d ON p.TK_Drustvo = d.idDrustvo
        WHERE p.TK_Drustvo = ?
    `;

    connection.query(query, [drustvoId], function (err, results) {
        if (err) {
            console.error("Error fetching projects for drustvo:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results);
        console.log("Fetched projects for drustvo z id: " + drustvoId);
    });
});
router.get('/prostovoljec', (req, res) => {
    const prostovoljecId = req.query.id;
    console.log("Fetching projects for prostovoljec z id: " + prostovoljecId);
    if (!prostovoljecId) return res.status(400).json({ error: 'Manjka id prostovoljca' });

    const query = `
        SELECT 
            p.idProjekt, 
            p.naziv, 
            p.cilj, 
            p.datumIzvajanja, 
            p.trajanje, 
            p.tezavnost, 
            p.datumRokaPrijave, 
            p.Lokacija, 
            p.kratekOpis, 
            p.opis, 
            d.naziv as drustvo_naziv
        FROM Projekt p
        LEFT JOIN Drustvo d ON p.TK_Drustvo = d.idDrustvo
        INNER JOIN Prostovoljec_Projekt pp ON pp.TK_Projekt = p.idProjekt
        WHERE pp.TK_Prostovoljec = ?
    `;

    connection.query(query, [prostovoljecId], function (err, results) {
        if (err) {
            console.error("Error fetching projects for prostovoljec:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results);
        console.log("Fetched projects for prostovoljec z id: " + prostovoljecId);
    });
});

module.exports = router;
