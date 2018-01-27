var http = require('http');
var express = require('express');
var url = require('url')
var utils = require('./utils.js');
var db = require('./database.js');
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
app.use(express.static(__dirname + '/public'));
app.set('views', 'public/views');
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
app.get('/login', (req, res) => {
	//TODO
	//logout first
	model = { errorLogin: false };
	res.render('login.ejs', model);

});

app.get('/register', (req, res) => {
	//TODO
	//logout first
	res.render('register.ejs');
});


app.post('/login', function (req, res) {
	sess = req.session;
	sess.email = req.body.email;
	sess.pass = req.body.pass;
	//print(req.body);
	db.checkValidLogData(sess.email, sess.pass, data => {
		if (data) {
			sess.isValid = true;
			sess.userId = data.id;
			res.redirect('/main');
		}
		else {
			model = { errorLogin: true };
			sess.isValid = false;
			res.render('login.ejs', model);
			// res.redirect('/errorlogin');//TODO okienko dialogowe
		}
	})
});

app.post('/register', function (req, res) {
	name = req.body.name;
	pass = req.body.pass;
	email = req.body.email;
	print(req.body);
	db.findUserByEmail(email, data => {
		if (data) {
			//TODO: jakiś error
			res.redirect('/register');
		}
		else {
			db.createUser(name, email, pass);
			print("User created");
			res.redirect('/login');
		}
	})
});

app.post('/addFriend', (req, res) => {
	sess = req.session;
	friendEmail = req.body.friendEmail;
	var userId = sess.userId;
	db.findUserByEmail(friendEmail, friendData => {
		//print("user: " + userId);
		var friendId = friendData.id;
		//print("friend: " + friendId);
		db.addFriend(userId, friendId, data => {
			switch (data) {
				case (0):
					res.redirect('/main'); // TODO: wysłano zaproszenie						
					break;
				case (1):
					res.redirect('/main'); // TODO: nie możesz wysłać zaproszenia ponownie						
					break;
				case (2):
					res.redirect('/main'); // TODO: już jesteście znajomymi
					break;
				case (3):
					res.redirect('/main'); // TODO: Zostaliście znajomymi			
					break;
			}
		})
	})
})

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
	sess = req.session;
	if (sess.isValid) {
		model = { email: sess.email }
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
//Lista socketów, chyba się przyda
socketList = [];

io.on('connection', function (socket) {
	if (sess.isValid) {
		console.log('client connected:' + socket.id);
		if (sess.isValid) {
			// print(socket.room);
			socketList.push(socket);
		}

		socket.on('friend list', function (data) {
			db.listFriends(sess.userId, friendsList => {
			socket.emit('friend list', friendsList);
			})
			// socket.emit('chat message', {value: socket.id, email: sess.email});//diagnostic
		});

		socket.on('diag', function (data) {
			if (data == "exit") {
				socketList.splice(socketList.indexOf(socket), 1); //na wyjściu usuwam kanał z listy aktywnych
			}
		})
		socket.on('room', function (room) {
			print(room);
			print(socket.room);
			if (socket.room) {
				socket.leave(socket.room);
			}
			socket.join(room);
			socket.room = room;
			socket.emit('chat message', { value: "joined " + room, email: sess.email });//diagnostic
		});

		socket.on('chat message', function (data) {
			io.to(socket.room).emit('chat message', data);
			// socket.rooms
		});
		socket.on('user list', function (data) {
			db.lookForEmail(data, emails => {
				print(emails);
				socket.emit('user list', emails);
			});
		});
	}
	else {
		socket.emit('diag', 'notLogged');
	}
});



setInterval(function () {
	var date = new Date().toString();
	io.emit('time', date.toString());
	// print(socketList.map(a => a.id));//można wywalić
}, 1000);
