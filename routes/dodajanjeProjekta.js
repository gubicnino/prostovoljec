const express = require('express');
const router = express.Router();
const connection = require('../db/database');

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
        lokacija, // Changed to lowercase
        kratekOpis,
        opis
    } = req.body;

    // Validacija obaveznih polja
    if (!naziv || !cilj || !datumIzvajanja || !datumRokaPrijave || !lokacija) {
        console.log('Nedostaju obavezni podaci:', req.body);
        return res.status(400).json({ error: 'Obavezna polja: naziv, cilj, datumIzvajanja, datumRokaPrijave, lokacija' });
    }

    // Validacija datuma (rok prijave mora biti pre datuma izvajanja)
    if (new Date(datumRokaPrijave) >= new Date(datumIzvajanja)) {
        console.log('Nevalidni datumi:', { datumRokaPrijave, datumIzvajanja });
        return res.status(400).json({ error: 'Rok prijave mora biti pre datuma izvajanja' });
    }

    // Privzemi ID društva (promeni prema potrebama)
    const TK_Drustvo = 1; // TODO: Dobavi iz sesije ili forme

    // SQL ukaz za vstavljanje projekta u bazu
    const sql = `
        INSERT INTO Projekt (
            naziv, cilj, datumIzvajanja, trajanje, tezavnost, 
            datumRokaPrijave, lokacija, kratekOpis, opis, TK_Drustvo
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
        lokacija,
        kratekOpis,
        opis,
        TK_Drustvo
    ];
    console.log('SQL vrednosti:', values);

    // Izvedi SQL ukaz
    connection.query(sql, values, (err, result) => {
        if (err) {
            console.error('Napaka pri shranjevanju projekta:', err);
            return res.status(500).json({ error: `Napaka pri upisu u bazu: ${err.message}` });
        }

        console.log('Projekt uspešno dodat u bazu, ID:', result.insertId);
        res.status(200).json({ message: 'Projekt uspešno dodan' });
    });
});

module.exports = router;