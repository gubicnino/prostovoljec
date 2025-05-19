const express = require('express');
const router = express.Router();
const connection = require('../db/database');

// Ključ mora biti enak tistemu, ki si ga uporabil pri šifriranju vstavljenih gesel!
const AES_KEY = 'moja_skrivnost';

console.log('Prijava router je naložen!');

router.post('/', (req, res) => {
    console.log('Prejeta POST zahteva za prijavo');
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Manjkajoči podatki' });
    }

    // Preveri Prostovoljec
    const queryProstovoljec = `
        SELECT idProstovoljec FROM Prostovoljec
        WHERE username = ? AND password = AES_ENCRYPT(?, 'tajni_kljuc')
    `;
    connection.query(queryProstovoljec, [username, password, AES_KEY], (error, results) => {
        if (error) {
            console.error('Napaka pri poizvedbi za Prostovoljec:', error);
            return res.status(500).json({ success: false, error: 'Napaka pri prijavi' });
        }

        if (results.length > 0) {
            const id = results[0].idProstovoljec;
            return res.status(200).json({
                success: true,
                user: { prostovoljecId: id }
            });
        }

        // Če ne obstaja, preveri še Drustvo
        const queryDrustvo = `
            SELECT idDrustvo FROM Drustvo
            WHERE username = ? AND password = AES_ENCRYPT(?, 'tajni_kljuc')
        `;
        connection.query(queryDrustvo, [username, password, AES_KEY], (error2, results2) => {
            if (error2) {
                console.error('Napaka pri poizvedbi za Drustvo:', error2);
                return res.status(500).json({ success: false, error: 'Napaka pri prijavi' });
            }

            if (results2.length > 0) {
                const id = results2[0].idDrustvo;
                return res.status(200).json({
                    success: true,
                    user: { drustvoId: id }
                });
            }

            return res.status(401).json({
                success: false,
                error: 'Uporabniško ime ali geslo je napačno'
            });
        });
    });
});

module.exports = router;
