var express = require("express");
var router = express.Router();
var connection = require("../db/database");

router.get("/", function (req, res, next) {
    const { search, tezavnost, lokacija, sort, spretnost } = req.query;

    let query = `
        SELECT p.idProjekt, p.naziv, p.cilj, p.datumIzvajanja, p.trajanje, p.tezavnost, 
               p.datumRokaPrijave, p.Lokacija, p.kratekOpis, p.opis, d.naziv as drustvo_naziv
        FROM Projekt p
        LEFT JOIN Drustvo d ON p.TK_Drustvo = d.idDrustvo
        WHERE 1=1
    `;
    const params = [];

    // Search po nazivu
    if (search) {
        query += " AND p.naziv LIKE ?";
        params.push(`%${search}%`);
    }
    // Filter po tezavnosti
    if (tezavnost) {
        query += " AND p.tezavnost = ?";
        params.push(tezavnost);
    }
    // Filter po lokaciji
    if (lokacija) {
        query += " AND p.Lokacija LIKE ?";
        params.push(`%${lokacija}%`);
    }
    // Filter po spretnosti
    if (spretnost) {
        query += " AND (p.zahteve LIKE ?)";
        params.push(`%${spretnost}%`);
    }

    // Sortiranje
    if (sort) {
        // Primer: datumIzvajanja_desc ali datumIzvajanja_asc
        const [field, direction] = sort.split('_');
        const allowedFields = ['datumIzvajanja', 'datumRokaPrijave', 'naziv', 'tezavnost'];
        const allowedDirections = ['asc', 'desc'];
        if (allowedFields.includes(field) && allowedDirections.includes(direction)) {
            query += ` ORDER BY p.${field} ${direction.toUpperCase()}`;
        }
    } else {
        query += " ORDER BY p.datumIzvajanja DESC";
    }

    connection.query(query, params, function (err, results) {
        if (err) {
            console.error("Error fetching projects:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results);
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

// project-detail
router.get('/:id', (req, res) => {
    const projectId = parseInt(req.params.id, 10);
    
    const query = `
        SELECT 
            p.*,
            d.naziv as drustvo_naziv,
            d.telStevilka as drustvo_tel,
            d.email as drustvo_email,
            d.naslov as drustvo_naslov,
            (SELECT COUNT(*) FROM Prostovoljec_Projekt WHERE TK_Projekt = p.idProjekt) as stevilo_prijavljenih
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
            p.idProstovoljec,
            p.ime,
            p.primek,
            p.spretnost,
            p.znacka,
            p.opravljeneUre AS skupne_ure,
            pp.ure,
            pp.ocena,
            pp.komentar,
            pp.potrejno,
            pp.TK_Projekt
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

// Vsi tudi ce niso potrjeni
router.get('/:id/volunteers/vsi', (req, res) => {
    const projectId = parseInt(req.params.id, 10);
    
    if (isNaN(projectId)) {
        return res.status(400).json({ error: 'Invalid project ID' });
    }

    const query = `
        SELECT 
            p.idProstovoljec,
            p.ime,
            p.primek AS primek,
            p.spretnost,
            p.znacka,
            p.opravljeneUre AS skupne_ure,
            pp.ure,
            pp.ocena,
            pp.komentar,
            pp.potrejno,
            pp.TK_Projekt
        FROM Prostovoljec_Projekt pp
        JOIN Prostovoljec p ON pp.TK_Prostovoljec = p.idProstovoljec
        WHERE pp.TK_Projekt = ?
    `;

    connection.query(query, [projectId], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results || []);
    });
});

function getIO() {
    return require('../app').io || global.io;
}

router.post('/:id/volunteers/feedback', async (req, res) => {
    const projectId = parseInt(req.params.id, 10);
    const feedbacks = req.body.feedbacks;

    if (!Array.isArray(feedbacks)) {
        return res.status(400).json({ error: "Podatki niso pravilni" });
    }

    try {
        // Pridobi podatke o projektu in društvu za obvestila
        const projektQuery = `
            SELECT p.naziv, p.TK_Drustvo, d.naziv as drustvo_naziv
            FROM Projekt p 
            JOIN Drustvo d ON p.TK_Drustvo = d.idDrustvo 
            WHERE p.idProjekt = ?
        `;
        
        const projektData = await new Promise((resolve, reject) => {
            connection.query(projektQuery, [projectId], (err, results) => {
                if (err) reject(err);
                else resolve(results[0]);
            });
        });

        // Posodobi podatke in pošlji obvestila
        const updatePromises = feedbacks.map(fb => {
            return new Promise(async (resolve, reject) => {
                const sql = `
                    UPDATE Prostovoljec_Projekt
                    SET ocena = ?, komentar = ?, potrejno = ?
                    WHERE TK_Projekt = ? AND TK_Prostovoljec = ?
                `;
                
                connection.query(sql, [fb.ocena, fb.komentar, fb.potrditev, projectId, fb.id], async (err, result) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    // Pošlji obvestila če se potrejno spremeni (bodisi 1 ALI 0)
                    if (fb.potrditev == 1 || fb.potrditev == 0) {
                        try {
                            const { saveNotificationToDB } = require('../websocket/socketHandler');
                            
                            // Pridobi podatke o prostovoljcu
                            const prostovoljcQuery = 'SELECT ime, primek FROM Prostovoljec WHERE idProstovoljec = ?';
                            const prostovoljcData = await new Promise((resolve, reject) => {
                                connection.query(prostovoljcQuery, [fb.id], (err, results) => {
                                    if (err) reject(err);
                                    else resolve(results[0]);
                                });
                            });

                            if (prostovoljcData && projektData) {
                                let prostovoljcMessage, drustvoMessage;
                                
                                if (fb.potrditev == 1) {
                                    // POTRJENA UDELEŽBA
                                    prostovoljcMessage = `Vaša udeležba na projektu "${projektData.naziv}" je bila potrjena. Oglejte si svojo oceno in povratne informacije.`;
                                    drustvoMessage = `Uspešno ste potrdili udeležbo prostovoljca ${prostovoljcData.ime} ${prostovoljcData.primek} na projektu "${projektData.naziv}".`;
                                } else {
                                    // ZAVRNJENA UDELEŽBA
                                    prostovoljcMessage = `Vaša udeležba na projektu "${projektData.naziv}" je bila zavrnjena.`;
                                    drustvoMessage = `Uspešno ste zavrnili udeležbo prostovoljca ${prostovoljcData.ime} ${prostovoljcData.primek} na projektu "${projektData.naziv}".`;
                                }

                                // Shrani obvestili v bazo
                                await saveNotificationToDB(fb.id, 'prostovoljec', prostovoljcMessage);
                                await saveNotificationToDB(projektData.TK_Drustvo, 'drustvo', drustvoMessage);

                                // Pošlji real-time obvestila
                                const io = global.io;
                                if (io) {
                                    // Za prostovoljca
                                    io.to(`prostovoljec_${fb.id}`).emit('newNotification', {
                                        message: prostovoljcMessage,
                                        timestamp: new Date(),
                                        type: fb.potrditev == 1 ? 'participation_confirmed' : 'participation_rejected'
                                    });

                                    // Za društvo
                                    io.to(`drustvo_${projektData.TK_Drustvo}`).emit('newNotification', {
                                        message: drustvoMessage,
                                        timestamp: new Date(),
                                        type: fb.potrditev == 1 ? 'participation_confirmation' : 'participation_rejection'
                                    });
                                }
                            }
                        } catch (notificationError) {
                            console.error('Napaka pri pošiljanju obvestil za potrditev/zavrnitev udeležbe:', notificationError);
                        }
                    }

                    resolve(result);
                });
            });
        });

        await Promise.all(updatePromises);
        res.json({ success: true });
        
    } catch (err) {
        console.error('Napaka pri shranjevanju povratnih informacij:', err);
        res.status(500).json({ error: "Napaka pri shranjevanju" });
    }
});

module.exports = router;