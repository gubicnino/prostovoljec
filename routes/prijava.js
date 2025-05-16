const express = require('express');
const router = express.Router();
const connection = require('../db/database');

// Za razhroščevanje
console.log('Prijava router je naložen!');

// POST zahteva za prijavo
router.post('/', (req, res) => {
    console.log('Prejeta POST zahteva za prijavo');
    console.log('Prejeti podatki:', req.body);

    const {username, password} = req.body;

    if (!username || !password) {
        console.log('Manjkajoči podatki');
        return res.status(400).json({ error: 'Manjkajoči podatki' 
        });
    }

    connection.query(
        'SELECT * FROM Prostovoljec WHERE username = ? AND password = ?',
        [username, password],
        (error, results) => {
            if (error) {
                console.error('Napaka pri poizvedbi:', error);
                return res.status(500).json({ error: 'Napaka pri prijavi' 
                });
            }

            console.log('Rezultati poizvedbe:', results);

            if (results && results.length > 0) {
                const user = results[0];
                console.log('Uspešna prijava');
                return res.status(200).json({ message: 'Uspešna prijava' });
            } else {
                console.log('Neveljavni podatki za prijavo', username);
                return res.status(401).json({ error: 'Uporabniško ime ali geslo je napačno' 
                });
            }
        }
    );

});

module.exports = router;