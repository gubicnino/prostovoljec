var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
require('dotenv').config();

var app = express();
const prijavaRouter = require('./routes/prijava');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var projektiRouter = require('./routes/projekti');
var profilRouter = require('./routes/profil');
var registracijaRouter = require('./routes/registracija');
<<<<<<< HEAD
var dodajanjeRouter = require('./routes/dodajanjeProjekta');
console.log('Sve rute uspešno učitane');
=======
var naseZvezdeRouter = require('./routes/naseZvezde'); 

>>>>>>> 4ccfbfad58b0a327bcd4ca495e93d1b6beb46160

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
<<<<<<< HEAD
app.use('/api/dodajanjeProjekta', dodajanjeRouter);

=======
app.use('/api/naseZvezde', naseZvezdeRouter);
>>>>>>> 4ccfbfad58b0a327bcd4ca495e93d1b6beb46160


if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server teče na portu ${PORT}`);
        console.log(`Obiščite: http://localhost:${PORT}/`);
    });
}

module.exports = app;
