const express = require("express");
const router = express.Router();
const session = require('express-session');

router.get('/',(req,res)=>{
    res.render('index', { user: req.session.user });
});

router.get('/login',(req,res)=>{
    if(req.session.user){
        res.redirect('welcome');
    } else{
        const msg1 = req.flash('message');
        res.render('login', { msg1, user: req.session.user });
    }
});

router.get('/register',(req,res)=>{
    const msg1 = req.flash('message');
    res.render('register', { msg1, user: req.session.user });
});

router.get('/welcome',(req,res)=>{
    if(req.session.user){
        res.render('welcome', { msg1: req.session.user, user: req.session.user });
    } else{
        res.redirect('/');
    }
});

router.get('/about', (req, res) => {
    if(req.session.user){
        res.render('about', { msg1: req.session.user, user: req.session.user });
    } else {
        res.redirect('/login');
    }
});

router.get('/services', (req, res) => {
    if(req.session.user){
        res.render('services', { msg1: req.session.user, user: req.session.user });
    } else {
        res.redirect('/login');
    }
});

router.get('/portfolio', (req, res) => {
    if(req.session.user){
        res.render('portfolio', { msg1: req.session.user, user: req.session.user });
    } else {
        res.redirect('/login');
    }
});

router.get('/contact', (req, res) => {
    if(req.session.user){
        res.render('contact', { msg1: req.session.user, user: req.session.user });
    } else {
        res.redirect('/login');
    }
});

router.get('/logout',(req,res)=>{
    req.session.destroy((err) => {
        if(err) {
            console.log(err);
        }
        res.clearCookie("user_sid");
        res.redirect('/');
    });
});

module.exports = router;