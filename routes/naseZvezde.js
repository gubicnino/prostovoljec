var express = require('express');
var router = express.Router();
var connection = require('../db/database');

// TOP 6 SORTIRANO PO VRAJ
router.get('/top-volunteers', function(req, res) {
    console.log('Fetching top volunteers...');
    
    const query = `
        SELECT idProstovoljec, ime, primek, opravljeneUre, znacka, spretnost
        FROM Prostovoljec
        ORDER BY opravljeneUre DESC
        LIMIT 6
    `;

    connection.query(query, function(err, results) {
        if (err) {
            return res.status(500).json({ error: 'Database error', details: err.message });
        }
        console.log('Successfully fetched volunteers:', results.length);
        res.json(results);
    });
});

// statistika skupna (naseZvezde.html kartice)
router.get('/statistics', function(req, res) {    
    const query = `
        SELECT 
            (SELECT COUNT(*) FROM Prostovoljec) AS totalVolunteers,
            (SELECT COUNT(*) FROM Drustvo) AS totalOrganizations,
            (SELECT COUNT(*) FROM Projekt) AS totalProjects,
            (SELECT COALESCE(SUM(opravljeneUre), 0) FROM Prostovoljec) AS totalHours
    `;

    connection.query(query, function(err, results) {
        if (err) {
            return res.status(500).json({ error: 'Database error', details: err.message });
        }
        res.json(results[0]); 
    });
});

module.exports = router;