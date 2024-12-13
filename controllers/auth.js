const mysql = require('mysql');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');

//====================== Database Connection ===================================

const dbConfig = {
    host: process.env.DB_HOST || 'mysql',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'P@ssw0rd',
    database: process.env.DB_NAME || 'sql_login',
    port: process.env.DB_PORT || 3306,
};

let db;

function handleDisconnect() {
    db = mysql.createConnection(dbConfig);

    db.connect(function(err) {
        if(err) {
            console.error('Error connecting to the database:', err);
            setTimeout(handleDisconnect, 2000);
        } else {
            console.log('Connected to database successfully');
            
            // Create table if it doesn't exist
            const createTableQuery = `
                CREATE TABLE IF NOT EXISTS users (
                    id INT NOT NULL AUTO_INCREMENT,
                    firstname VARCHAR(256),
                    lastname VARCHAR(256),
                    email VARCHAR(256),
                    password VARCHAR(256),
                    PRIMARY KEY (id)
                )
            `;
            
            db.query(createTableQuery, function(err) {
                if (err) {
                    console.error('Error creating table:', err);
                } else {
                    console.log('Table checked/created successfully');
                }
            });
        }
    });

    db.on('error', function(err) {
        console.error('Database error:', err);
        if(err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleDisconnect();
        } else {
            throw err;
        }
    });
}

handleDisconnect();

//====================== START LOGIN ===================================
exports.login=(req,res)=>{
    var email = req.body.email;
    var password = req.body.password;
    if(!email || !password){
        req.flash('message','Email and password Required');
        return res.redirect('/login');
    }
    db.query("SELECT * FROM users WHERE email = ?", [email], async (error,results) =>{
        if (error) {
            console.error('Database query error:', error);
            req.flash('message', 'An error occurred. Please try again later.');
            return res.redirect('/login');
        };
        if (results.length > 0) {
            var dbPassword=results[0]['password'];
            var dbFirstname=results[0]['firstname'];
            const valid = await bcrypt.compare(req.body.password, dbPassword);
            if (!valid) {
                req.flash('message','Password is Wrong, Try again!');
                return res.redirect('/login');
            } else {
                req.session.user = dbFirstname;
                req.session.userId = results[0].id;
                req.session.isAuthenticated = true;
                req.session.save((err) => {
                    if (err) {
                        console.error('Session save error:', err);
                        req.flash('message', 'An error occurred during login');
                        return res.redirect('/login');
                    }
                    return res.redirect('/welcome');
                });
            }
        } else {
            req.flash('message', "User Doesn't Exist");
            return res.redirect('/login');
        }
    });
}
//====================== END LOGIN ===================================

//====================== START REGISTER ==============================
exports.register=(req,res)=>{
    const {firstname, lastname, email, password, passwordconfirm} = req.body;
    
    // First check if the database connection is active
    if (!db || !db.state || db.state === 'disconnected') {
        req.flash('message', 'Database connection error. Please try again later.');
        return res.redirect('../register');
    }

    db.query('SELECT email FROM users WHERE email = ?' , [email], async (error,results) => {
        if (error) {
            console.error('Database query error:', error);
            req.flash('message', 'An error occurred. Please try again later.');
            return res.redirect('../register');
        }
        
        if (results && results.length > 0) {
            req.flash('message', 'This Email is Already in USE');
            return res.redirect('../register');
        }
        else if (password !== passwordconfirm){
            req.flash('message', "Password do not match");
            return res.redirect('../register');
        }
        let hashedPassword = await bcrypt.hash(password, 8);
        db.query('INSERT INTO users SET ?', {email: email, password: hashedPassword, firstname: firstname, lastname: lastname}, (error, results)=> {
            if (error) {
                console.error('Database query error:', error);
                req.flash('message', 'An error occurred. Please try again later.');
                return res.redirect("/register");
            } else {
                req.flash('message', "Your Data submited successfully!");
                return res.redirect('../register');
            }

        })
    })
}
//====================== END REGISTER ===================================
