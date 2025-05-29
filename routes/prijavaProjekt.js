const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Prijava prostovoljca na projekt
router.post('/projekt', (req, res) => {
    const { prostovoljecId, projektId } = req.body;

    if (!prostovoljecId || !projektId) {
        return res.status(400).json({ success: false, message: 'Manjkajoči podatci: prostovoljecId i projektId su obavezni.' });
    }

    const query = `
        INSERT INTO Prostovoljec_Projekt (TK_Prostovoljec, TK_Projekt, potrejno)
        VALUES (?, ?, 1)
    `;

    db.query(query, [prostovoljecId, projektId], (err, result) => {
        if (err) {
            console.error('Napaka pri prijavi na projekt:', err);
            return res.status(500).json({ success: false, message: 'Napaka pri prijavi na projekt.' });
        }
        res.status(201).json({ success: true, message: 'Uspešno ste se prijavili na projekt.' });
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
    `;

    db.query(deleteQuery, [prostovoljecId, projektId], (err, result) => {
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

        res.json({ 
            success: true, 
            message: 'Prostovoljec uspešno odjavljen s projekta.' 
        });
    });
});
module.exports = router;