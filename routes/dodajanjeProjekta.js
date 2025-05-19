const express = require('express');
const router = express.Router();
const connection = require('../db/database'); // Povezava z bazom podataka u public/

// Debug poruka za proveru učitavanja fajla
console.log('dodajanjeProjekta.js uspešno učitan');

// POST endpoint za dodavanje novog projekta
router.post('/', (req, res) => {
    console.log('POST zahtev primljen na /dodajanjeProjekta:', req.body);
    
    // Pridobi podatke iz obrazca
    const {
        naziv,
        cilj,
        datumIzvajanja,
        trajanje,
        tezavnost,
        datumRokaPrijave,
        Lokacija,
        kratekOpis,
        opis
    } = req.body;
    console.log(req.body);

    // Privzemi ID društva (u realnoj aplikaciji bi to dobili iz sesije ili forme)
    const TK_Drustvo = 1; // Promeni prema potrebama

    // SQL ukaz za vstavljanje projekta u bazu
    const sql = `
        INSERT INTO Projekt (
            naziv, cilj, datumIzvajanja, trajanje, tezavnost, 
            datumRokaPrijave, Lokacija, kratekOpis, opis, TK_Drustvo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Podaci za vstavljanje
    const values = [
        naziv,
        cilj,
        datumIzvajanja,
        trajanje,
        tezavnost,
        datumRokaPrijave,
        Lokacija,
        kratekOpis,
        opis,
        TK_Drustvo
    ];
    console.log(values);
    // Izvedi SQL ukaz
    connection.query(sql, values, (err, result) => {
        if (err) {
            console.error('Napaka pri shranjevanju projekta:', err);
            return res.status(500).json({ error: 'Napaka pri shranjevanju projekta' });
        }

        // Uspešno shranjeno, vrni odgovor
        console.log('Projekt uspešno dodat u bazu');
        res.status(200).json({ message: 'Projekt uspešno dodan' });
    });
});

module.exports = router;