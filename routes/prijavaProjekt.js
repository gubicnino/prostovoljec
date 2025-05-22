var express = require("express");
var router = express.Router();
var connection = require("../db/database");

// Prijava prostovoljca na projekt
router.post("/projekt", function (req, res, next) {
    const { prostovoljecId, projektId } = req.body;
    
    console.log(`Prijava prostovoljca ${prostovoljecId} na projekt ${projektId}`);
    
    if (!prostovoljecId || !projektId) {
        return res.status(400).json({ error: 'Manjkajo podatki za prijavo' });
    }
    
    // Najprej preverimo, če se prostovoljec že ni prijavil na ta projekt
    const checkQuery = `
        SELECT pp.idProstovoljec_Projekt 
        FROM Prostovoljec_Projekt pp 
        WHERE pp.TK_Prostovoljec = ? AND pp.TK_Projekt = ?
    `;
    
    connection.query(checkQuery, [prostovoljecId, projektId], function (err, existingResults) {
        if (err) {
            console.error("Napaka pri preverjanju obstoječe prijave:", err);
            return res.status(500).json({ error: "Napaka pri preverjanju prijave" });
        }
        
        if (existingResults.length > 0) {
            return res.status(400).json({ error: "Že ste prijavljeni na ta projekt" });
        }
        
        // Preverimo kapaciteto projekta
        const capacityQuery = `
            SELECT 
                p.naziv,
                COUNT(pp.TK_Prostovoljec) as trenutno_prijavljenih
            FROM Projekt p
            LEFT JOIN Prostovoljec_Projekt pp ON p.idProjekt = pp.TK_Projekt
            WHERE p.idProjekt = ?
            GROUP BY p.idProjekt, p.naziv
        `;
        
        connection.query(capacityQuery, [projektId], function (err, capacityResults) {
            if (err) {
                console.error("Napaka pri preverjanju kapacitete:", err);
                return res.status(500).json({ error: "Napaka pri preverjanju kapacitete" });
            }
            
            // Vstavimo prijavo
            const insertQuery = `
                INSERT INTO Prostovoljec_Projekt (TK_Projekt, TK_Prostovoljec, ocena, ure, komentar, potrejno) 
                VALUES (?, ?, NULL, 0, NULL, 0)
            `;
            
            connection.query(insertQuery, [projektId, prostovoljecId], function (err, insertResults) {
                if (err) {
                    console.error("Napaka pri vstavitvi prijave:", err);
                    return res.status(500).json({ error: "Napaka pri prijavi na projekt" });
                }
                
                console.log(`Prostovoljec ${prostovoljecId} uspešno prijavljen na projekt ${projektId}`);
                res.json({ 
                    message: "Uspešno prijavljen na projekt",
                    prijavId: insertResults.insertId
                });
            });
        });
    });
});

module.exports = router;