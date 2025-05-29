var express = require('express');
var router = express.Router();
var connection = require("../db/database");

// pridobij vse obvestila glede na uporabnika
router.get('/:userType/:userId', (req, res) => {
    const { userType, userId } = req.params;
    
    if (!['prostovoljec', 'drustvo'].includes(userType)) {
        return res.status(400).json({ success: false, message: 'Neveljaven tip uporabnika' });
    }
    
    const query = `
        SELECT idObvestilo, sporocilo, DATE_ADD(cas, INTERVAL 1 HOUR) as cas, prebrano
        FROM Obvestila 
        WHERE tip_uporabnika = ? AND ${userType === 'prostovoljec' ? 'TK_Prostovoljec' : 'TK_Drustvo'} = ?
        ORDER BY cas DESC
        LIMIT 20
    `;
    
    connection.query(query, [userType, userId], (err, results) => {
        if (err) {
            console.error('Napaka pri pridobivanju obvestil:', err);
            return res.status(500).json({ success: false, message: 'Napaka pri pridobivanju obvestil' });
        }
        
        res.json({ success: true, notifications: results });
    });
});

// oznaci obvestila sive barve kda klikness "oznaci kot prebrano"
router.put('/mark-read/:userType/:userId', (req, res) => {
    const { userType, userId } = req.params;
    
    if (!['prostovoljec', 'drustvo'].includes(userType)) {
        return res.status(400).json({ success: false, message: 'Neveljaven tip uporabnika' });
    }
    
    const query = `
        UPDATE Obvestila 
        SET prebrano = TRUE
        WHERE tip_uporabnika = ? AND ${userType === 'prostovoljec' ? 'TK_Prostovoljec' : 'TK_Drustvo'} = ?
    `;
    
    connection.query(query, [userType, userId], (err, result) => {
        if (err) {
            console.error('Napaka pri označevanju obvestil:', err);
            return res.status(500).json({ success: false, message: 'Napaka pri označevanju obvestil' });
        }
        
        res.json({ success: true, message: 'Obvestila označena kot prebrana', updatedCount: result.affectedRows });
    });
});

// brisanje obvestil kda kliknes na izbrisi gumb
router.delete('/delete-all/:userType/:userId', (req, res) => {
    const { userType, userId } = req.params;
    
    if (!['prostovoljec', 'drustvo'].includes(userType)) {
        return res.status(400).json({ success: false, message: 'Neveljaven tip uporabnika' });
    }
    
    const query = `
        DELETE FROM Obvestila 
        WHERE tip_uporabnika = ? AND ${userType === 'prostovoljec' ? 'TK_Prostovoljec' : 'TK_Drustvo'} = ?
    `;
    
    connection.query(query, [userType, userId], (err, result) => {
        if (err) {
            console.error('Napaka pri brisanju obvestil:', err);
            return res.status(500).json({ success: false, message: 'Napaka pri brisanju obvestil' });
        }
        
        res.json({ success: true, message: 'Vsa obvestila so bila izbrisana', deletedCount: result.affectedRows });
    });
});

// štetje obvestil kera nejso bla "prebrana" z gumbon
router.get('/unread-count/:userType/:userId', (req, res) => {
    const { userType, userId } = req.params;
    
    if (!['prostovoljec', 'drustvo'].includes(userType)) {
        return res.status(400).json({ success: false, message: 'Neveljaven tip uporabnika' });
    }
    
    const query = `
        SELECT COUNT(*) as count
        FROM Obvestila 
        WHERE tip_uporabnika = ? AND ${userType === 'prostovoljec' ? 'TK_Prostovoljec' : 'TK_Drustvo'} = ?
            AND prebrano = FALSE
    `;
    
    connection.query(query, [userType, userId], (err, results) => {
        if (err) {
            console.error('Napaka pri štetju obvestil:', err);
            return res.status(500).json({ success: false, message: 'Napaka pri štetju obvestil' });
        }
        
        res.json({ success: true, count: results[0].count });
    });
});

module.exports = router;