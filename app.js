const express = require('express');
const mysql = require('mysql');
const bodyParser = require("body-parser");
const dotenv = require('dotenv');
const path = require('path');
const urlpages = require('./routes/pages');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');

dotenv.config({ path: './.env'});
const publicDirectory = path.join(__dirname,'./public');

const app = express();

// Serve static files
app.use(express.static(publicDirectory));
app.use('/css', express.static(path.join(__dirname, 'public/css')));
app.use('/js', express.static(path.join(__dirname, 'public/js')));
app.use('/img', express.static(path.join(__dirname, 'public/img')));

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.set('view engine', 'ejs');

//=============== Session ====================
app.use(cookieParser('SecretStringForCookies'));
app.use(session({
    key: 'user_sid',
    secret: 'SecretStringForSession',
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 24 * 60 * 60 * 1000 // 24 hours
    }
}));
app.use(flash());

// Middleware to check auth status
app.use((req, res, next) => {
    if (req.cookies.user_sid && !req.session.user) {
        res.clearCookie('user_sid');
    }
    res.locals.user = req.session.user;
    next();
});

app.use('/', urlpages);
app.use('/auth', require('./routes/auth'));

app.listen(process.env.PORT || 5006, () => {
    console.log("server started on port: " + (process.env.PORT || 5006));
});

module.exports = app;
