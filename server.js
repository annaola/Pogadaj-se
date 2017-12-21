var http = require('http');
var express = require('express');
var url = require('url')
var utils = require('./utils.js');
var https = require('https');
var fs = require('fs');
var multer = require('multer')
var upload = multer({ dest: 'uploads/' })
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var FileStore = require('session-file-store')(session);
var socket = require('socket.io');

var app = express();
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(session({secret: 'ssshhhhh',saveUninitialized: true, resave: true}));
 
var sess;
var server = http.createServer(app);
var io = socket(server);
// nested sessios
app.use('/sessions', session({
    secret: 'keyboard cat',
    store: new FileStore,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 } //60 sec session
}))

app.get('/', (req, res) => {
	sess=req.session;
	if(sess.email)
	{
		res.redirect('/main');
	}
	else{
	res.render('index.ejs');
	}
});

app.post('/login',function(req,res){
	sess=req.session;	
	sess.email=req.body.email;
	res.end('done');
});

app.get('/main', (req,res)=> {
	sess=req.session;
	
	if(sess.email)	
	{
		model={email: sess.email}
		res.render('main', model);
	}
	else
	{
		res.write('<h1>Please login first.</h1>');
		res.end('<a href='+'/'+'>Login</a>');
	}
	
});
app.get('/logout',function(req,res){
	
	req.session.destroy(function(err){
		if(err){
			console.log(err);
		}
		else
		{
			res.redirect('/');
		}
	});

});

app.get('/chat', (req, res) => {
    res.render('chat');
});

app.get('/plik', (req, res) => {

    res.setHeader('Content-disposition', 'attachment; filename=test.html');

    res.write('123');
    res.end();
});

app.get('/deklaracja', (req, res) => {
	res.render('deklaracja');
});

app.post('/deklaracja', (req, res) => {
    var name = req.body.name;
    var lecture = req.body.lecture;
    var date = req.body.date;
    var punkty = {
        1: req.body.zad1,
        2: req.body.zad2,
        3: req.body.zad3,
        4: req.body.zad4,
        5: req.body.zad5,
        6: req.body.zad6,
        7: req.body.zad7,
        8: req.body.zad8,
        9: req.body.zad9,
        10: req.body.zad10,
    };
    for (const p in punkty) {
        if (punkty[p] == '') {
            punkty[p] = 0;
        }
    }
    res.redirect(
        url.format({
            pathname: "print",
            query: {
                name: name,
                lecture: lecture,
                punkty: utils.intDictEncode(punkty),
                date: date,
            }
        }));
});

app.get('/print', (req, res) => {
    var punkty = utils.intDictDecode(req.query.punkty)
    var model = req.query;
    model.punkty = punkty;
    console.log(punkty)
    res.render('print', model);
});



//zadanie 6.1
app.get('/file', (req, res) => {
    res.render('file');
});

app.post('/file', upload.single('file'), function (req, res) {
    var model = { https: 0, http: 1 };
    res.render('main.ejs', model)
    console.log("poszło");
});
//zadanie 6.2
app.get('/radio', (req, res) => {
    var model = {
        t1: "text1",
        t2: "text2"
    }
    res.render('radio', model);
})

//zadanie 6.3
app.get('/cookie', (req, res) => {
    var model = {}
    res.cookie('nazwaCiastka1', 'wartoscCiastka1', { maxAge: 120 * 1000000 });
    res.cookie('nazwaCiastka2', 'wartoscCiastka2', { maxAge: 120 * 100 });
    model.cookie = req.cookies;
    res.render('ciastka', model);
})
//clear cookies
app.get('/clear', (req, res) => {
    res.clearCookie('nazwaCiastka1');
    res.clearCookie('nazwaCiastka2');
    res.redirect('/');
})

// app.get('/sessions', (req, res, next) => {
//     var sess = req.session;

//     if (sess.name) {
//         res.write('Hi ' + sess.name + '\n');
//     } else {
//         sess.name = req.query.name;
//     }
//     next();
// })
// app.get('/sessions', (req, res) => {
//     var sess = req.session

//     if (sess.views) {
//         sess.views++
//         res.write('views: ' + sess.views + '\n')
//         res.write('expires in: ' + (sess.cookie.maxAge / 1000) + 's')
//         res.end()
//     } else {
//         sess.views = 1
//         res.end('welcome to the session demo. refresh!')
//     }
// })


app.use((req, res, next) => {
    res.render('404.ejs', { url: req.url });
});

app.get('/admin',function(req,res){
	sess=req.session;
	if(sess.email)	
	{
		res.write('<h1>Hello '+sess.email+'</h1><br>');
		res.end('<a href='+'/logout'+'>Logout</a>');
	}
	else
	{
		res.write('<h1>Please login first.</h1>');
		res.end('<a href='+'/'+'>Login</a>');
	}

});


// tu uruchamiamy serwer
server.listen( process.env.PORT || 3000 );

console.log('serwer started');

io.on('connection', function(socket) {
    console.log('client connected:' + socket.id);
    socket.on('chat message', function(data) {
        io.emit('chat message', data); // do wszystkich
        // socket.emit('chat message', data); //tylko do połączonego
    })
});

setInterval( function() {
    var date = new Date().toString();
    io.emit( 'message', date.toString() );
}, 1000 );
