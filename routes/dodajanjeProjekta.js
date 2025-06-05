const express = require('express');
const router = express.Router();
const connection = require('../db/database');


// POST endpoint za dodavanje novog projekta
router.post('/', (req, res) => {
    console.log('POST zahtev primljen na /dodajanjeProjekta:', req.body);

    const { naziv, cilj, datumIzvajanja, trajanje, tezavnost, datumRokaPrijave, lokacija, kratekOpis, opis, TK_Drustvo, kapaciteta, zahteve, slika } = req.body;


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
            datumRokaPrijave, lokacija, kratekOpis, opis, TK_Drustvo, kapaciteta, zahteve, slika
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Podaci za vstavljanje
    const values = [
        naziv, cilj, datumIzvajanja, trajanje, tezavnost,
        datumRokaPrijave, lokacija, kratekOpis, opis, TK_Drustvo, kapaciteta, zahteve, slika
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
        zahteve,
        slika
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
            zahteve = ?,
            slika = ?
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
        slika,
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

// DELETE endpoint za brisanje projekta
router.delete('/:id', (req, res) => {
    console.log('DELETE zahtev primljen na /dodajanjeProjekta/:id:', req.params.id, req.body);

    const projectId = parseInt(req.params.id, 10);
    const { drustvoId } = req.body;

    // Validacija ulaznih podataka
    if (isNaN(projectId) || !drustvoId) {
        console.log('Nevalidni parametri:', { projectId, drustvoId });
        return res.status(400).json({ error: 'Manjkajoči ali nevalidni parametri: id projekta i id društva su obavezni' });
    }

    // Provera da li projekat postoji i pripada društvu
    const checkSql = `
        SELECT idProjekt
        FROM Projekt
        WHERE idProjekt = ? AND TK_Drustvo = ?
    `;

    connection.query(checkSql, [projectId, drustvoId], (err, results) => {
        if (err) {
            console.error('Napaka pri proveri projekta:', err);
            return res.status(500).json({ error: `Napaka pri proveri projekta: ${err.message}` });
        }

        if (results.length === 0) {
            console.log('Projekat nije pronađen ili društvo nema ovlašćenje:', { projectId, drustvoId });
            return res.status(403).json({ error: 'Projekat nije pronađen ili nemate ovlašćenje za brisanje' });
        }

        // Brisanje povezanih podataka iz Prostovoljec_Projekt
        const deleteRelatedSql = `
            DELETE FROM Prostovoljec_Projekt
            WHERE TK_Projekt = ?
        `;

        connection.query(deleteRelatedSql, [projectId], (err) => {
            if (err) {
                console.error('Napaka pri brisanju povezanih podataka:', err);
                return res.status(500).json({ error: `Napaka pri brisanju povezanih podataka: ${err.message}` });
            }

            // Brisanje projekta
            const deleteSql = `
                DELETE FROM Projekt
                WHERE idProjekt = ?
            `;

            connection.query(deleteSql, [projectId], (err, result) => {
                if (err) {
                    console.error('Napaka pri brisanju projekta:', err);
                    return res.status(500).json({ error: `Napaka pri brisanju projekta: ${err.message}` });
                }

                if (result.affectedRows === 0) {
                    console.log('Projekat nije pronađen:', projectId);
                    return res.status(404).json({ error: 'Projekat nije pronađen' });
                }

                console.log('Projekat uspešno obrisan, ID:', projectId);
                res.status(200).json({ message: 'Projekat uspešno obrisan' });
            });
        });
    });
});