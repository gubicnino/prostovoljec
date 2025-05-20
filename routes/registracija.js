const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Registracija prostovoljca
router.post('/prostovoljec', (req, res) => {
    const { ime, primek, telStevilka, datumRojstva, email, naslov, username, password } = req.body;

    const query = `
        INSERT INTO Prostovoljec (ime, primek, telStevilka, datumRojstva, email, naslov, username, password)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(query, [ime, primek, telStevilka, datumRojstva, email, naslov, username, password], (err, result) => {
        if (err) {
            console.error('Napaka pri vstavljanju prostovoljca:', err);
            return res.status(500).json({ success: false, message: 'Napaka pri registraciji.' });
        }
        res.status(201).json({ success: true, message: 'Prostovoljec uspešno registriran.' });
    });
});

// Registracija društva
router.post('/drustvo', (req, res) => {
    const { naziv, poslanstvo, naslov, tipDrustva, telStevilka, email, steviloClanov, username, password } = req.body;

    const query = `
        INSERT INTO Drustvo (naziv, poslanstvo, naslov, tipDrustva, telStevilka, email, steviloClanov, username, password)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(query, [naziv, poslanstvo, naslov, tipDrustva, telStevilka, email, steviloClanov, username, password], (err, result) => {
        if (err) {
            console.error('Napaka pri vstavljanju društva:', err);
            return res.status(500).json({ success: false, message: 'Napaka pri registraciji.' });
        }
        res.status(201).json({ success: true, message: 'Društvo uspešno registrirano.' });
    });
});

module.exports = router;
