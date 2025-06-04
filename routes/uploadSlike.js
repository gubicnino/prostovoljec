const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../public/img/projekti');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueName = `projekt_${Date.now()}_${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 3 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Dovoljene so samo slike!'), false);
        }
    }
});

router.post('/projekt', upload.single('slika'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Ni bile naložene datoteke' });
        }

        const relativePath = `img/projekti/${req.file.filename}`;
        
        res.json({
            success: true,
            filename: req.file.filename,
            path: relativePath
        });
    } catch (error) {
        console.error('Napaka pri uploadu:', error);
        res.status(500).json({ error: 'Napaka pri nalaganju slike' });
    }
});

module.exports = router;