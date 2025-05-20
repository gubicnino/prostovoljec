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

router.get('/latest', (req, res) => {
    console.log("Fetching latest 3 projects");
    const query = `
        SELECT p.idProjekt, p.naziv, p.cilj, p.datumIzvajanja, p.trajanje, p.tezavnost, p.datumRokaPrijave, p.Lokacija, p.kratekOpis, p.opis, d.naziv as drustvo_naziv
        FROM Projekt p
        LEFT JOIN Drustvo d ON p.TK_Drustvo = d.idDrustvo
        WHERE p.datumIzvajanja >= CURDATE()
        ORDER BY p.datumIzvajanja ASC
        LIMIT 3
    `;

    connection.query(query, function (err, results) {
        if (err) {
            console.error("Error pri iskanje latest projektov:", err);
            return res.status(500).json({ error: "Database error" });
        }
        
        results.forEach(project => {
            console.log(`{
                idProjekt: ${project.idProjekt},
                naziv: '${project.naziv}',
                cilj: '${project.cilj}',
                datumIzvajanja: ${project.datumIzvajanja.toISOString()},
                trajanje: '${project.trajanje}',
                tezavnost: '${project.tezavnost}',
                datumRokaPrijave: ${project.datumRokaPrijave.toISOString()},
                Lokacija: '${project.Lokacija}',
                kratekOpis: '${project.kratekOpis}',
                opis: '${project.opis}',
                drustvo_naziv: '${project.drustvo_naziv}'
                },`);
        });
        res.json(results);
    });
});

// project-detail;
router.get('/:id', (req, res) => {
    const projectId = parseInt(req.params.id, 10);
    
    const query = `
        SELECT 
            p.*,
            d.naziv as drustvo_naziv,
            d.telStevilka as drustvo_tel,
            d.email as drustvo_email,
            d.naslov as drustvo_naslov,
            (SELECT COUNT(*) FROM Prostovoljec_Projekt WHERE TK_Projekt = p.idProjekt AND potrejno = 1) as stevilo_prijavljenih
        FROM Projekt p
        LEFT JOIN Drustvo d ON p.TK_Drustvo = d.idDrustvo
        WHERE p.idProjekt = ?
    `;

    connection.query(query, [projectId], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: "Project not found" });
        }
        res.json(results[0]);
    });
});

// Kateri prostovoljci so vpisani v projekt
router.get('/:id/volunteers', (req, res) => {
    const projectId = parseInt(req.params.id, 10);
    
    if (isNaN(projectId)) {
        return res.status(400).json({ error: 'Invalid project ID' });
    }

    const query = `
        SELECT 
            p.ime,
            p.primek,
            p.spretnost,
            p.znacka,
            p.opravljeneUre as skupne_ure,
            pp.ure,
            pp.ocena,
            pp.komentar,
            pp.potrejno
        FROM Prostovoljec_Projekt pp
        JOIN Prostovoljec p ON pp.TK_Prostovoljec = p.idProstovoljec
        WHERE pp.TK_Projekt = ? AND pp.potrejno = 1
        ORDER BY pp.ocena DESC
    `;

    connection.query(query, [projectId], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results || []);
    });
});


module.exports = router;
