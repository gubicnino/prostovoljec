const express = require('express');
const router = express.Router();
const connection = require('../db/database');

// Debug
console.log('Prijava router je naložen!');

router.post('/', (req, res) => {
    console.log('Prejeta POST zahteva za prijavo');
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Manjkajoči podatki' });
    }

    // Najprej preverimo v tabeli Prostovoljec
    connection.query(
        'SELECT idProstovoljec FROM Prostovoljec WHERE username = ? AND password = ?',
        [username, password],
        (error, results) => {
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
            } else {
                // Če ni najden, preverimo še v tabeli Drustvo
                connection.query(
                    'SELECT idDrustvo FROM Drustvo WHERE username = ? AND password = ?',
                    [username, password],
                    (error2, results2) => {
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
                        } else {
                            // Neveljavni podatki
                            return res.status(401).json({
                                success: false,
                                error: 'Uporabniško ime ali geslo je napačno'
                            });
                        }
                    }
                );
            }
        }
    );
});

module.exports = router;
