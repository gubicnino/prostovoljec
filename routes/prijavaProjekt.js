const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { saveNotificationToDB } = require('../websocket/socketHandler');

// Prijava prostovoljca na projekt
router.post('/projekt', async (req, res) => {
    const { prostovoljecId, projektId } = req.body;

    if (!prostovoljecId || !projektId) {
        return res.status(400).json({ success: false, message: 'Manjkajoči podatci: prostovoljecId i projektId su obavezni.' });
    }

    const checkQuery = `
        SELECT COUNT(*) as count 
        FROM Prostovoljec_Projekt 
        WHERE TK_Prostovoljec = ? AND TK_Projekt = ?
    `;

    db.query(checkQuery, [prostovoljecId, projektId], (err, checkResult) => {
        if (err) {
            console.error('Napaka pri preverjanju prijave:', err);
            return res.status(500).json({ success: false, message: 'Napaka pri preverjanju prijave.' });
        }

        if (checkResult[0].count > 0) {
            return res.status(409).json({ 
                success: false, 
                message: 'Že ste prijavljeni na ta projekt.' 
            });
        }

        const insertQuery = `
            INSERT INTO Prostovoljec_Projekt (TK_Prostovoljec, TK_Projekt, potrejno) VALUES (?, ?, 0)
        `;

        db.query(insertQuery, [prostovoljecId, projektId], async (err, result) => {
            if (err) {
                console.error('Napaka pri prijavi na projekt:', err);
                return res.status(500).json({ success: false, message: 'Napaka pri prijavi na projekt.' });
            }

            try {
                // Pridobi podatke o prostovoljcu
                const prostovoljcQuery = 'SELECT ime, primek FROM Prostovoljec WHERE idProstovoljec = ?';
                db.query(prostovoljcQuery, [prostovoljecId], async (err, prostovoljcResult) => {
                    if (err) {
                        console.error('Napaka pri pridobivanju podatkov prostovoljca:', err);
                        return res.status(201).json({ success: true, message: 'Uspešno ste se prijavili na projekt.' });
                    }

                    // Pridobi podatke o projektu in društvu
                    const projektQuery = `
                        SELECT p.naziv, p.TK_Drustvo, d.naziv as drustvo_naziv 
                        FROM Projekt p 
                        JOIN Drustvo d ON p.TK_Drustvo = d.idDrustvo 
                        WHERE p.idProjekt = ?
                    `;
                    
                    db.query(projektQuery, [projektId], async (err, projektResult) => {
                        if (err) {
                            console.error('Napaka pri pridobivanju podatkov projekta:', err);
                            return res.status(201).json({ success: true, message: 'Uspešno ste se prijavili na projekt.' });
                        }

                        if (prostovoljcResult.length > 0 && projektResult.length > 0) {
                            const prostovoljc = prostovoljcResult[0];
                            const projekt = projektResult[0];
                            
                            try {
                                // Obvestilo za prostovoljca
                                const prostovoljcMessage = `Prijavili ste se na projekt: ${projekt.naziv}`;
                                await saveNotificationToDB(prostovoljecId, 'prostovoljec', prostovoljcMessage);
                                
                                // Obvestilo za društvo
                                const drustvMessage = `${prostovoljc.ime} ${prostovoljc.primek} se je prijavil/a na: ${projekt.naziv}`;
                                await saveNotificationToDB(projekt.TK_Drustvo, 'drustvo', drustvMessage);
                                
                                // poslje obvestilo prek websocketaa
                                const io = req.app.get('io');
                                if (io) {
                                    io.to(`prostovoljec_${prostovoljecId}`).emit('newNotification', {
                                        message: prostovoljcMessage,
                                        timestamp: new Date(),
                                        type: 'project_application'
                                    });
                                    
                                    io.to(`drustvo_${projekt.TK_Drustvo}`).emit('newNotification', {
                                        message: drustvMessage,
                                        timestamp: new Date(),
                                        type: 'project_application'
                                    });
                                }
                            } catch (notificationError) {
                                console.error('Napaka pri pošiljanju obvestil:', notificationError);
                            }
                        }

                        res.status(201).json({ success: true, message: 'Uspešno ste se prijavili na projekt.' });
                    });
                });
            } catch (error) {
                console.error('Napaka pri obdelavi obvestil:', error);
                res.status(201).json({ success: true, message: 'Uspešno ste se prijavili na projekt.' });
            }
        });
    });
});

// Odjava prostovoljca sa projekta
router.delete('/projekt', async (req, res) => {
    const { prostovoljecId, projektId } = req.body;

    // Validacija podataka
    if (!prostovoljecId || !projektId) {
        return res.status(400).json({ 
            success: false, 
            message: 'Manjkajo potrebni podatki (prostovoljecId in projektId).' 
        });
    }

    // Najprej pridobi podatke pred brisanjem za obvestila
    const getDataQuery = `
        SELECT p.naziv, p.TK_Drustvo, d.naziv as drustvo_naziv, pr.ime, pr.primek
        FROM Prostovoljec_Projekt pp
        JOIN Projekt p ON pp.TK_Projekt = p.idProjekt
        JOIN Drustvo d ON p.TK_Drustvo = d.idDrustvo
        JOIN Prostovoljec pr ON pp.TK_Prostovoljec = pr.idProstovoljec
        WHERE pp.TK_Prostovoljec = ? AND pp.TK_Projekt = ?
    `;

    db.query(getDataQuery, [prostovoljecId, projektId], (err, dataResult) => {
        if (err) {
            console.error('Napaka pri pridobivanju podatkov:', err);
        }

        // SQL upit za brisanje veze između prostovoljca i projekta
        const deleteQuery = `
            DELETE FROM Prostovoljec_Projekt 
            WHERE TK_Prostovoljec = ? AND TK_Projekt = ?
        `;

        db.query(deleteQuery, [prostovoljecId, projektId], async (err, result) => {
            if (err) {
                console.error('Napaka pri brisanju prostovoljca s projekta:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Napaka pri odjavi prostovoljca s projekta.' 
                });
            }

            // Provera da li je nešto obrisano
            if (result.affectedRows === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Prostovoljec ni bil najden na tem projektu.' 
                });
            }

            // Pošlji obvestila o odjavi
            if (dataResult && dataResult.length > 0) {
                const data = dataResult[0];
                
                try {
                    // Obvestilo za prostovoljca
                    const prostovoljcMessage = `Odjavili ste se s projekta: ${data.naziv}`;
                    await saveNotificationToDB(prostovoljecId, 'prostovoljec', prostovoljcMessage);
                    
                    // Obvestilo za društvo
                    const drustvMessage = `${data.ime} ${data.primek} se je odjavil/a s projekta: ${data.naziv}`;
                    await saveNotificationToDB(data.TK_Drustvo, 'drustvo', drustvMessage);
                    
                    const io = req.app.get('io');
                    if (io) {
                        io.to(`prostovoljec_${prostovoljecId}`).emit('newNotification', {
                            message: prostovoljcMessage,
                            timestamp: new Date(),
                            type: 'project_withdrawal'
                        });
                        
                        io.to(`drustvo_${data.TK_Drustvo}`).emit('newNotification', {
                            message: drustvMessage,
                            timestamp: new Date(),
                            type: 'project_withdrawal'
                        });
                    }
                } catch (notificationError) {
                    console.error('Napaka pri pošiljanju obvestil o odjavi:', notificationError);
                }
            }

            res.json({ 
                success: true, 
                message: 'Prostovoljec uspešno odjavljen s projekta.' 
            });
        });
    });
});

module.exports = router;