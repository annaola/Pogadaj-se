var http = require('http');
var express = require('express');
var url = require('url')
var utils = require('./utils.js');

var app = express();
app.set('view engine', 'ejs');
app.set('views', './views');

app.get('/', (req, res) => {
    var model = { https: 0, http: 1 };
    res.render('main', model);
});


app.use((req, res, next) => {
    res.render('404.ejs', { url: req.url });
});


// tu uruchamiamy serwer
var server = http.createServer(app).listen( process.env.PORT || 3000 );
// var server = https.createServer(options, app1).listen(3001);
console.log('serwer started');
