var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
require('dotenv').config();

var app = express();
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var projektiRouter = require('./routes/projekti');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api/projekti', projektiRouter);


if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server teče na portu ${PORT}`);
        console.log(`Obiščite: http://localhost:${PORT}/`);
    });
}

module.exports = app;
