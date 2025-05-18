var express = require("express");
var router = express.Router();
var connection = require("../db/database");

router.get("/drustvo", function (req, res, next) {
    const drustvoId = req.query.id;
    console.log("Fetching data for drustvo z id: " + drustvoId);
    if (!drustvoId) return res.status(400).json({ error: 'Manjka id društva' });

    const query = `
        SELECT d.idDrustvo, d.naziv, d.naslov, d.poslanstvo
        FROM Drustvo d
        WHERE d.idDrustvo = ?
    `;

    connection.query(query, [drustvoId], function (err, results) {
        if (err) {
            console.error("Error fetching data for drustvo:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results[0]);
        console.log("Fetched data for drustvo z id: " + drustvoId);
    });
});

router.get("/prostovoljec", function (req, res, next) {
    const prostovoljecId = req.query.id;
    console.log("Fetching data for prostovoljec z id: " + prostovoljecId);
    if (!prostovoljecId) return res.status(400).json({ error: 'Manjka id prostovoljca' });

    const query = `
        SELECT 
            p.idProstovoljec, 
            p.primek, 
            p.ime, 
            p.telStevilka, 
            p.datumRojstva, 
            p.email, 
            p.opravljeneUre, 
            p.naslov, 
            p.spretnost, 
            p.znacka
        FROM Prostovoljec p
        WHERE p.idProstovoljec = ?
    `;

    connection.query(query, [prostovoljecId], function (err, results) {
        if (err) {
            console.error("Error fetching data for prostovoljec:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results[0]);
        console.log("Fetched data for prostovoljec z id: " + prostovoljecId);});
});

router.post("/drustvoShrani", function (req, res, next) {
    const { id, naziv, lokacija, poslanstvo } = req.body;
    console.log("Shranjevanje podatkov za društvo z id: " + id);

    if (!id || !naziv || !lokacija || !poslanstvo) {
        return res.status(400).json({ error: 'Manjkajoči podatki' });
    }
    const query = `
        UPDATE Drustvo
        SET naziv = ?, naslov = ?, poslanstvo = ?
        WHERE idDrustvo = ?
    `;
    connection.query(query, [naziv, lokacija, poslanstvo, id], function (err, results) {
        if (err) {
            console.error("Napaka pri shranjevanju podatkov za društvo:", err);
            return res.status(500).json({ error: "Napaka pri shranjevanju podatkov" });
        }
        res.json({ message: "Podatki uspešno shranjeni" });
        console.log("Podatki uspešno shranjeni za društvo z id: " + id);
    });
});

router.post("/prostovoljecShrani", function (req, res, next) {
    const { id, ime, primek, telStevilka, datumRojstva, email, naslov, spretnost } = req.body;
    console.log("Shranjevanje podatkov za prostovoljca z id: " + id);

    if (!id || !ime || !primek || !telStevilka || !datumRojstva || !email || !naslov || !spretnost) {
        return res.status(400).json({ error: 'Manjkajoči podatki' });
    }
    const query = `
        UPDATE Prostovoljec
        SET ime = ?, primek = ?, telStevilka = ?, datumRojstva = ?, email = ?, naslov = ?, spretnost = ?
        WHERE idProstovoljec = ?
    `;
    connection.query(query, [ime, primek, telStevilka, datumRojstva, email, naslov, spretnost, id], function (err, results) {
        if (err) {
            console.error("Napaka pri shranjevanju podatkov za prostovoljca:", err);
            return res.status(500).json({ error: "Napaka pri shranjevanju podatkov" });
        }
        res.json({ message: "Podatki uspešno shranjeni" });
        console.log("Podatki uspešno shranjeni za prostovoljca z id: " + id);
    });
});

module.exports = router;
