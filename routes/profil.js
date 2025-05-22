var express = require("express");
var router = express.Router();
var connection = require("../db/database");

router.get("/drustvo", function (req, res, next) {
    const drustvoId = req.query.id;
    console.log("Fetching data for drustvo z id: " + drustvoId);
    if (!drustvoId) return res.status(400).json({ error: 'Manjka id društva' });

    const query = `
        SELECT d.idDrustvo, d.naziv, d.naslov, d.poslanstvo, d.username, d.password, d.telStevilka, d.email, d.tipDrustva, d.steviloClanov
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
            p.znacka,
            p.username,
            p.password
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
    const { id, naziv, lokacija, poslanstvo, usernameDrustva, passwordDrustva, telStevilkaDrustva, emailDrustva, tipDrustva } = req.body;
    console.log("Shranjevanje podatkov za društvo z id: " + id);

    if (!id || !naziv || !lokacija || !poslanstvo) {
        return res.status(400).json({ error: 'Manjkajoči podatki' });
    }
    const query = `
        UPDATE Drustvo
        SET naziv = ?, naslov = ?, poslanstvo = ?, username = ?, password = ?, telStevilka = ?, email = ?, tipDrustva = ?
        WHERE idDrustvo = ?
    `;
    connection.query(
        query,
        [naziv, lokacija, poslanstvo, usernameDrustva, passwordDrustva, telStevilkaDrustva, emailDrustva, tipDrustva, id],
        function (err, results) {
            if (err) {
                console.error("Napaka pri shranjevanju podatkov za društvo:", err);
                return res.status(500).json({ error: "Napaka pri shranjevanju podatkov" });
            }
            res.json({ message: "Podatki uspešno shranjeni" });
            console.log("Podatki uspešno shranjeni za društvo z id: " + id);
        }
    );
});

router.post("/prostovoljecShrani", function (req, res, next) {
    const { id, ime, primek, telStevilka, datumRojstva, email, naslov, spretnost, username, password } = req.body;
    console.log("Shranjevanje podatkov za prostovoljca z id: " + id);

    if (!id || !ime || !primek || !telStevilka || !datumRojstva || !email || !naslov || !spretnost || !username || !password) {
        return res.status(400).json({ error: 'Manjkajoči podatki' });
    }
    const query = `
        UPDATE Prostovoljec
        SET ime = ?, primek = ?, telStevilka = ?, datumRojstva = ?, email = ?, naslov = ?, spretnost = ?, username = ?, password = ?
        WHERE idProstovoljec = ?
    `;
    connection.query(query, [ime, primek, telStevilka, datumRojstva, email, naslov, spretnost, username, password, id], function (err, results) {
        if (err) {
            console.error("Napaka pri shranjevanju podatkov za prostovoljca:", err);
            return res.status(500).json({ error: "Napaka pri shranjevanju podatkov" });
        }
        res.json({ message: "Podatki uspešno shranjeni" });
        console.log("Podatki uspešno shranjeni za prostovoljca z id: " + id);
    });
});

// Pridobi prijavnice za društvo
router.get("/prijavnice", function (req, res, next) {
    const drustvoId = req.query.drustvoId;
    console.log("Fetching prijavnice for drustvo z id: " + drustvoId);
    
    if (!drustvoId) {
        return res.status(400).json({ error: 'Manjka id društva' });
    }

    const query = `
        SELECT 
            pp.idProstovoljec_Projekt,
            pr.ime,
            pr.primek,
            pr.email,
            pr.telStevilka,
            p.naziv as projekt_naziv,
            pp.potrejno,
            DATE_FORMAT(NOW(), '%d. %m. %Y') as datum_prijave
        FROM Prostovoljec_Projekt pp
        JOIN Prostovoljec pr ON pp.TK_Prostovoljec = pr.idProstovoljec
        JOIN Projekt p ON pp.TK_Projekt = p.idProjekt
        WHERE p.TK_Drustvo = ? AND pp.potrejno = 0
        ORDER BY pp.idProstovoljec_Projekt DESC
    `;

    connection.query(query, [drustvoId], function (err, results) {
        if (err) {
            console.error("Error fetching prijavnice:", err);
            return res.status(500).json({ error: "Database error" });
        }
        
        console.log(`Found ${results.length} prijavnic for drustvo ${drustvoId}`);
        res.json(results);
    });
});

// Sprejmi/zavrni prijavo
router.post("/potrditev-prijave", function (req, res, next) {
    const { prijavId, odobreno } = req.body;
    
    if (!prijavId || typeof odobreno !== 'boolean') {
        return res.status(400).json({ error: 'Manjkajo podatki' });
    }
    
    const query = `
        UPDATE Prostovoljec_Projekt 
        SET potrejno = ? 
        WHERE idProstovoljec_Projekt = ?
    `;
    
    const potrejno = odobreno ? 1 : -1; // 1 = odobreno, -1 = zavrnjeno, 0 = čaka
    
    connection.query(query, [potrejno, prijavId], function (err, results) {
        if (err) {
            console.error("Error updating prijava:", err);
            return res.status(500).json({ error: "Database error" });
        }
        
        const status = odobreno ? 'odobrena' : 'zavrnjena';
        console.log(`Prijava ${prijavId} je bila ${status}`);
        res.json({ message: `Prijava uspešno ${status}` });
    });
});

module.exports = router;
