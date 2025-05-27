const express = require('express');
const router = express.Router();
const connection = require('../db/database');


// POST endpoint za dodavanje novog projekta
router.post('/', (req, res) => {
    console.log('POST zahtev primljen na /dodajanjeProjekta:', req.body);

    const { naziv, cilj, datumIzvajanja, trajanje, tezavnost, datumRokaPrijave, lokacija, kratekOpis, opis, TK_Drustvo, kapaciteta, zahteve } = req.body;


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

    // SQL ukaz za vstavljanje projekta u bazu
    const sql = `
        INSERT INTO Projekt (
            naziv, cilj, datumIzvajanja, trajanje, tezavnost, 
            datumRokaPrijave, lokacija, kratekOpis, opis, TK_Drustvo, kapaciteta, zahteve
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Podaci za vstavljanje
    const values = [
        naziv, cilj, datumIzvajanja, trajanje, tezavnost,
        datumRokaPrijave, lokacija, kratekOpis, opis, TK_Drustvo, kapaciteta, zahteve
    ];

    // Izvedi SQL ukaz
    connection.query(sql, values, (err, result) => {
        if (err) {
            console.error('Napaka pri shranjevanju projekta:', err);
            return res.status(500).json({ error: `Napaka pri upisu u bazu: ${err.message}` });
        }

        console.log('Uspešno dodan/urejen projekt, ID:', result.insertId);
        res.status(200).json({ message: 'Projekt uspešno dodan' });
    });
});
router.post('/urejanje', (req, res) => {
    console.log('POST zahtev primljen na /dodajanjeProjekta:', req.body);

    const {
        naziv,
        cilj,
        datumIzvajanja,
        trajanje,
        tezavnost,
        datumRokaPrijave,
        lokacija, // Changed to lowercase
        kratekOpis,
        opis,
        TK_Drustvo,
        idProjekt,
        kapaciteta,
        zahteve
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

    // SQL ukaz za vstavljanje projekta u bazu
    const sql = `
        UPDATE Projekt SET
            naziv = ?,
            cilj = ?,
            datumIzvajanja = ?,
            trajanje = ?,
            tezavnost = ?,
            datumRokaPrijave = ?,
            lokacija = ?,
            kratekOpis = ?,
            opis = ?,
            kapaciteta = ?,
            TK_Drustvo = ?,
            zahteve = ?
        WHERE idProjekt = ?
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
        kapaciteta,
        TK_Drustvo,
        zahteve,
        idProjekt,
    ];

    // Izvedi SQL ukaz
    connection.query(sql, values, (err, result) => {
        if (err) {
            console.error('Napaka pri shranjevanju projekta:', err);
            return res.status(500).json({ error: `Napaka pri upisu u bazu: ${err.message}` });
        }

        console.log('Uspešno dodan/urejen projekt, ID:', result.insertId);
        res.status(200).json({ message: 'Projekt uspešno dodan' });
    });
});

module.exports = router;