const express = require('express');
const router = express.Router();
var connection = require("../db/database");
const { saveNotificationToDB } = require('../websocket/socketHandler');

// Prijava prostovoljca na projekt
router.post('/projekt', async (req, res) => {
    const { prostovoljecId, projektId } = req.body;

    if (!prostovoljecId || !projektId) {
        return res.status(400).json({ success: false, message: 'Manjkajoči podatci: prostovoljecId in projektId sta obvezna.' });
    }

    // First check if application already exists
    const checkQuery = `
        SELECT COUNT(*) as count 
        FROM Prosnja_Prostovoljec pp
        JOIN Prosnja p ON pp.TK_Prosnja = p.idProsnja
        WHERE pp.TK_Prostovoljec = ? AND p.projekt = ?
    `;

    connection.query(checkQuery, [prostovoljecId, projektId], (err, checkResult) => {
        if (err) {
            console.error('Napaka pri preverjanju prijave:', err);
            return res.status(500).json({ success: false, message: 'Napaka pri preverjanju prijave.' });
        }

        if (checkResult[0].count > 0) {
            return res.status(409).json({ 
                success: false, 
                message: 'Že ste poslali prijavo za ta projekt.' 
            });
        }

        // Create Prosnja entry first
        const prosnjaQuery = `
            INSERT INTO Prosnja (prostovoljec, projekt, datumPrijave, TK_Drustvo)
            SELECT ?, ?, NOW(), p.TK_Drustvo
            FROM Projekt p
            WHERE p.idProjekt = ?
        `;

        connection.query(prosnjaQuery, [prostovoljecId, projektId, projektId], (err, prosnjaResult) => {
            if (err) {
                console.error('Napaka pri ustvarjanju prosnje:', err);
                return res.status(500).json({ success: false, message: 'Napaka pri prijavi na projekt.' });
            }

            const prosnjaId = prosnjaResult.insertId;

            // Create Prosnja_Prostovoljec entry
            const prosnjaProstQuery = `
                INSERT INTO Prosnja_Prostovoljec (TK_Prosnja, TK_Prostovoljec)
                VALUES (?, ?)
            `;

            connection.query(prosnjaProstQuery, [prosnjaId, prostovoljecId], async (err, result) => {
                if (err) {
                    console.error('Napaka pri povezovanju prosnje s prostovoljcem:', err);
                    return res.status(500).json({ success: false, message: 'Napaka pri prijavi na projekt.' });
                }

                // Send notifications
                try {
                    const prostovoljcQuery = 'SELECT ime, primek FROM Prostovoljec WHERE idProstovoljec = ?';
                    connection.query(prostovoljcQuery, [prostovoljecId], async (err, prostovoljcResult) => {
                        const projektQuery = `
                            SELECT p.naziv, p.TK_Drustvo, d.naziv as drustvo_naziv 
                            FROM Projekt p 
                            JOIN Drustvo d ON p.TK_Drustvo = d.idDrustvo 
                            WHERE p.idProjekt = ?
                        `;
                        
                        connection.query(projektQuery, [projektId], async (err, projektResult) => {
                            if (prostovoljcResult?.length > 0 && projektResult?.length > 0) {
                                const prostovoljc = prostovoljcResult[0];
                                const projekt = projektResult[0];
                                
                                // Notifications for both parties
                                const prostovoljcMessage = `Vaša prijava na projekt "${projekt.naziv}" je bila poslana v pregled.`;
                                const drustvMessage = `Nova prijava od ${prostovoljc.ime} ${prostovoljc.primek} za projekt "${projekt.naziv}"`;
                                
                                await saveNotificationToDB(prostovoljecId, 'prostovoljec', prostovoljcMessage);
                                await saveNotificationToDB(projekt.TK_Drustvo, 'drustvo', drustvMessage);
                                
                                const io = req.app.get('io');
                                if (io) {
                                    io.to(`prostovoljec_${prostovoljecId}`).emit('newNotification', {
                                        message: prostovoljcMessage,
                                        timestamp: new Date(),
                                        type: 'application_sent'
                                    });
                                    
                                    io.to(`drustvo_${projekt.TK_Drustvo}`).emit('newNotification', {
                                        message: drustvMessage,
                                        timestamp: new Date(),
                                        type: 'new_application'
                                    });
                                }
                            }
                        });
                    });
                } catch (error) {
                    console.error('Napaka pri obdelavi obvestil:', error);
                }

                res.status(201).json({ 
                    success: true, 
                    message: 'Vaša prijava je bila uspešno poslana v pregled.' 
                });
            });
        });
    });
});

// Odjava prostovoljca sa projekta

router.delete('/projekt', (req, res) => {
    const { prostovoljecId, projektId } = req.body;

    // Validacija podataka
    if (!prostovoljecId || !projektId) {
        return res.status(400).json({ 
            success: false, 
            message: 'Manjkajo potrebni podatki (prostovoljecId in projektId).' 
        });
    }
    
    const deleteQuery = `
        DELETE FROM Prostovoljec_Projekt 
        WHERE TK_Prostovoljec = ? AND TK_Projekt = ?
=======
    // Najprej pridobi podatke pred brisanjem za obvestila
    const getDataQuery = `
        SELECT p.naziv, p.TK_Drustvo, d.naziv as drustvo_naziv, pr.ime, pr.primek
        FROM Prostovoljec_Projekt pp
        JOIN Projekt p ON pp.TK_Projekt = p.idProjekt
        JOIN Drustvo d ON p.TK_Drustvo = d.idDrustvo
        JOIN Prostovoljec pr ON pp.TK_Prostovoljec = pr.idProstovoljec
        WHERE pp.TK_Prostovoljec = ? AND pp.TK_Projekt = ?

    `;

    connection.query(getDataQuery, [prostovoljecId, projektId], (err, dataResult) => {
        if (err) {
            console.error('Napaka pri pridobivanju podatkov:', err);
        }

        // SQL upit za brisanje veze između prostovoljca in projekta
        const deleteQuery = `
            DELETE FROM Prostovoljec_Projekt 
            WHERE TK_Prostovoljec = ? AND TK_Projekt = ?
        `;

        connection.query(deleteQuery, [prostovoljecId, projektId], async (err, result) => {
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

// Check if volunteer has already applied
router.post('/check', (req, res) => {
    const { prostovoljecId, projektId } = req.body;

    const checkQuery = `
        SELECT COUNT(*) as count 
        FROM Prosnja_Prostovoljec pp
        JOIN Prosnja p ON pp.TK_Prosnja = p.idProsnja
        WHERE pp.TK_Prostovoljec = ? AND p.projekt = ?
    `;

    connection.query(checkQuery, [prostovoljecId, projektId], (err, result) => {
        if (err) {
            console.error('Error checking application:', err);
            return res.status(500).json({ hasApplication: false });
        }
        res.json({ hasApplication: result[0].count > 0 });
    });
});

module.exports = router;