var express = require("express");
var router = express.Router();
var connection = require("../db/database");
const { saveNotificationToDB } = require('../websocket/socketHandler');


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
            pp.idProsnja_Prostovoljec as prijavId,
            pr.ime,
            pr.primek,
            pr.email,
            pr.telStevilka,
            pr.spretnost,
            p.naziv as projekt_naziv,
            proj.idProjekt,
            pros.datumPrijave
        FROM Prosnja_Prostovoljec pp
        JOIN Prostovoljec pr ON pp.TK_Prostovoljec = pr.idProstovoljec
        JOIN Prosnja pros ON pp.TK_Prosnja = pros.idProsnja
        JOIN Projekt proj ON pros.projekt = proj.idProjekt
        JOIN Projekt p ON pros.projekt = p.idProjekt
        WHERE pros.TK_Drustvo = ?
        ORDER BY pros.datumPrijave DESC
    `;

    connection.query(query, [drustvoId], function (err, results) {
        if (err) {
            console.error("Error fetching prijavnice:", err);
            return res.status(500).json({ error: "Database error" });
        }
        
        console.log(`Found ${results.length} prijavnic for drustvo ${drustvoId}`);
        console.log("Rezultati:", results);
        res.json(results);
    });
});

// Sprejmi/zavrni prijavo
router.post("/potrditev-prijave", async function (req, res, next) {
    console.log("Received request body:", req.body);

    const prijavId = req.body.prijavId;
    const odobreno = req.body.odobreno;

    if (!prijavId) {
        console.log("Missing prijavId in request body:", req.body);
        return res.status(400).json({ error: 'Manjka ID prijave' });
    }

    try {
        // Pridobi podatke o prijavi
        const getPrijavaQuery = `
            SELECT 
                pp.idProsnja_Prostovoljec,
                pp.TK_Prostovoljec,
                pp.TK_Prosnja,
                pr.ime, pr.primek,
                p.projekt as projektId,
                proj.naziv as projekt_naziv,
                proj.TK_Drustvo
            FROM Prosnja_Prostovoljec pp
            JOIN Prosnja p ON pp.TK_Prosnja = p.idProsnja
            JOIN Prostovoljec pr ON pp.TK_Prostovoljec = pr.idProstovoljec
            JOIN Projekt proj ON p.projekt = proj.idProjekt
            WHERE pp.idProsnja_Prostovoljec = ?
        `;

        const prijavaData = await new Promise((resolve, reject) => {
            connection.query(getPrijavaQuery, [prijavId], (err, results) => {
                if (err) reject(err);
                else resolve(results[0]);
            });
        });

        if (!prijavaData) {
            return res.status(404).json({ error: 'Prijava ni bila najdena' });
        }

        // Če je prijava odobrena, dodaj v Prostovoljec_Projekt
        if (odobreno) {
            const insertQuery = `
                INSERT INTO Prostovoljec_Projekt 
                (TK_Prostovoljec, TK_Projekt, potrejno, ure)
                VALUES (?, ?, 1, 0)
            `;

            await new Promise((resolve, reject) => {
                connection.query(insertQuery, [
                    prijavaData.TK_Prostovoljec,
                    prijavaData.projektId
                ], (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                });
            });
        }

        // V vsakem primeru (sprejem ali zavrnitev) izbriši prijavo
        const deleteProsnjaQuery = `
            DELETE FROM Prosnja 
            WHERE idProsnja = ?
        `;

        await new Promise((resolve, reject) => {
            connection.query(deleteProsnjaQuery, [prijavaData.TK_Prosnja], (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });

        // Pošlji ustrezna obvestila
        const statusText = odobreno ? 'sprejeta' : 'zavrnjena';
        const prostovoljcMessage = `Vaša prijava na projekt "${prijavaData.projekt_naziv}" je bila ${statusText}.`;
        const drustvoMessage = `${odobreno ? 'Sprejeli' : 'Zavrnili'} ste prijavo prostovoljca ${prijavaData.ime} ${prijavaData.primek} na projekt "${prijavaData.projekt_naziv}".`;

        await saveNotificationToDB(prijavaData.TK_Prostovoljec, 'prostovoljec', prostovoljcMessage);
        await saveNotificationToDB(prijavaData.TK_Drustvo, 'drustvo', drustvoMessage);

        const io = req.app.get('io');
        if (io) {
            io.to(`prostovoljec_${prijavaData.TK_Prostovoljec}`).emit('newNotification', {
                message: prostovoljcMessage,
                timestamp: new Date(),
                type: 'application_response'
            });
            
            io.to(`drustvo_${prijavaData.TK_Drustvo}`).emit('newNotification', {
                message: drustvoMessage,
                timestamp: new Date(),
                type: 'application_processed'
            });
        }

        res.json({ 
            success: true, 
            message: `Prijava uspešno ${statusText}`,
            notificationsSent: true
        });

    } catch (error) {
        console.error('Napaka pri obdelavi prijave:', error);
        res.status(500).json({ error: 'Napaka pri obdelavi prijave' });
    }
});

module.exports = router;