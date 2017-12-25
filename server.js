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

var print = console.log

var app = express();
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'ssshhhhh', saveUninitialized: true, resave: true }));

var sess = {};
sess.isValid = false;
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
	sess = req.session;
	if (sess.isValid) {
		res.redirect('/main');
	}
	else {
		res.render('index.ejs');
	}
});

app.post('/login', function (req, res) {
	sess = req.session;
	sess.email = req.body.email;
	sess.pass = req.body.password;
	if (utils.isValid(sess.email, sess.pass)) {
		sess.isValid = true;
		res.redirect('/main');
	}
	else {
		sess.isValid = false;
		res.redirect('/errorlogin');
	}

	print(sess.email, sess.pass);
});

app.get('/main', (req, res) => {
	sess = req.session;
	if (sess.isValid) {
		model = { email: sess.email }
		res.render('main', model);
	}
	else {
		res.render('pleaseLogin');
	}

});
app.get('/logout', function (req, res) {

	req.session.destroy(function (err) {
		if (err) {
			console.log(err);
		}
		else {
			res.redirect('/');
		}
	});

});

app.get('/chat', (req, res) => {
	if (sess.isValid) {
		model = {}
		res.render('chat', model);
	}
	else {
		res.render('pleaseLogin');
	}

});


app.use((req, res, next) => {
	res.render('404.ejs', { url: req.url });
});



// tu uruchamiamy serwer
server.listen(process.env.PORT || 3000);

console.log('serwer started');

io.on('connection', function (socket) {
	console.log('client connected:' + socket.id);

	socket.on('friend list', function (data) {
		print(data);
		var friendList = utils.friendList(sess.email);
		io.emit('friend list', friendList);
		// io.emit('chat message', data); // do wszystkich
		// socket.emit('chat message', data); //tylko do połączonego
	});

	socket.on('chat message', function (data) {
		io.emit('chat message', data); // do wszystkich
		// socket.emit('chat message', data); //tylko do połączonego
	});
});





setInterval(function () {
	var date = new Date().toString();
	io.emit('time', date.toString());
}, 1000);
