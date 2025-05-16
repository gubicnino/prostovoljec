var express = require("express");
var router = express.Router();
var connection = require("../db/database");

router.get("/", function (req, res, next) {
    const query = `
    SELECT p.idProjekt, p.naziv, p.cilj, p.datumIzvajanja, p.trajanje, p.tezavnost, p.datumRokaPrijave, p.Lokacija, p.kratekOpis, p.opis, d.naziv as drustvo_naziv
    FROM Projekt p
    LEFT JOIN Drustvo d ON p.TK_Drustvo = d.idDrustvo
    `;

    connection.query(query, function (err, results) {
    if (err) {
        console.error("Error fetching projects:", err);
        return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
    });
});

module.exports = router;
