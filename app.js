var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var http = require('http');
var socketIo = require('socket.io');
require('dotenv').config();

var app = express();
var server = http.createServer(app);
var io = socketIo(server);

const { initializeSocketIO } = require('./websocket/socketHandler');

const prijavaRouter = require('./routes/prijava');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var projektiRouter = require('./routes/projekti');
var profilRouter = require('./routes/profil');
var registracijaRouter = require('./routes/registracija');
var dodajanjeRouter = require('./routes/dodajanjeProjekta');
var naseZvezdeRouter = require('./routes/naseZvezde'); 
var prijavaProjektRouter = require('./routes/prijavaProjekt');
var obvestilaRouter = require('./routes/obvestila');
const uploadSlike = require('./routes/uploadSlike');


initializeSocketIO(io);
app.set('io', io);
global.io = io;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/prijava', prijavaRouter);
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api/projekti', projektiRouter);
app.use('/api/profil', profilRouter);
app.use('/registracija', registracijaRouter);
app.use('/api/dodajanjeProjekta', dodajanjeRouter);
app.use('/api/prijavaProjekt', prijavaProjektRouter);
app.use('/api/naseZvezde', naseZvezdeRouter);
app.use('/api/obvestila', obvestilaRouter);
app.use('/api/upload', uploadSlike);

// Middleware za 404 greške
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Ruta nije pronađena.' });
});

if (require.main === module) {
    const PORT = process.env.PORT || 4000;
    server.listen(PORT, () => {
        console.log(`Server teče na portu ${PORT}`);
        console.log(`Obiščite: http://localhost:${PORT}/`);
    });
}

module.exports = app;