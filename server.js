// creating express instance
var express = require("express");
var app = express();


// create body parser instance
var bodyParser = require("body-parser");

// creating http instance
var http = require("http").createServer(app);

// creating socket io instance
var io = require("socket.io")(http);

let userid='';


// Create instance of mysql
var mysql = require("mysql");

//index.html
app.get('/', function(req, res){
    res.sendFile(__dirname + '/list.html');
  });

//users array init
var users = [];



// make a connection
var connection = mysql.createConnection({
	"host": "localhost",
	"user": "root",
	"password": "",
	"database": "test"
});

// connect
connection.connect(function (error) {
	// show error if any
	console.log(error);
});





app.use(express.static(__dirname + '/'));


// start the server
http.listen(3000, function () {
	console.log("Listening on*:3000");
});

//onconnection
io.on("connection", function (socket) {
	console.log("User connected", socket.id);

	// attach incoming listener for new user
	socket.on("user_connected", function (username) {
		// save in array
		users[username] = socket.id;
		userid=username;
		console.log(username);
		console.log(users);

		// socket ID will be used to send message to individual person

		// notify all connected clients
		io.emit("user_connected", username);
    });
    
    // listen from client inside IO "connection" event
    socket.on("send_message", function (data) {
	// send event to receiver
		var socketId = users[data.receiver];
		var status="not-read";
		console.log(socketId);
		console.log(data.message)
		console.log(data.sname)
		io.to(socketId).emit("new_message", data);

		if(users[data.receiver]!==undefined){
			status="read";
		}

		// save in database
		connection.query("INSERT INTO chat (sname, sender, rname, receiver, message, rstatus) VALUES ((SELECT name FROM user WHERE phone='"+data.sender+"'), '" + data.sender + "', (SELECT name FROM user WHERE phone='"+data.receiver+"'),'" + data.receiver + "', '" + data.message + "','"+status+"')", function (error, result) {
			console.log(error);
		});

	});
	
	socket.on('disconnect',function(){
		console.log("user disconnected:"+socket.id+","+userid);
		console.log(users[userid]!==undefined);
		console.log(userid);
		//delete users[userid];
		console.log(users[userid]!==undefined);
	});

});


// enable URL encoded for POST requests
app.use(bodyParser.urlencoded());

// enable headers required for POST request
app.use(function (request, result, next) {
	result.setHeader("Access-Control-Allow-Origin", "*");
	next();
});

// create api to return all messages
app.post("/get_messages", function (request, result) {
	// get all messages from database
	connection.query("SELECT * FROM chat WHERE (sender = '" + request.body.sender + "' AND receiver = '" + request.body.receiver + "') OR (sender = '" + request.body.receiver + "' AND receiver = '" + request.body.sender + "')", function (error, messages) {
		// response will be in JSON
		result.end(JSON.stringify(messages));
	});
});



// create api to get all users
app.post("/all_users", function (request, result) {
	// get all messages from database
	connection.query("SELECT id,name,phone FROM user WHERE NOT phone="+request.body.phone+" ORDER BY name ASC", function (error, messages) {
		// response will be in JSON
		console.log(error);
		result.end(JSON.stringify(messages));
	});
});



app.post("/get_name", function (request, result) {
	// get all messages from database
	connection.query("SELECT name FROM user WHERE phone="+request.body.phone, function (error, messages) {
		// response will be in JSON
		console.log(messages);
		result.end(JSON.stringify(messages));
	});
});



app.post("/chat_history", function (request, result) {
	// get all messages from database
	connection.query("SELECT id,name,phone,(select message from chat WHERE (receiver='"+request.body.phone+"' and sender=user.phone) or (sender='"+request.body.phone+"' and receiver=user.phone) order by id desc limit 1) as message,(select id from chat WHERE (receiver='"+request.body.phone+"' and sender=user.phone) or (sender='"+request.body.phone+"' and receiver=user.phone) order by id desc limit 1) as messageid from user WHERE phone in (SELECT receiver from chat where sender='"+request.body.phone+"') OR phone in (SELECT sender from chat where receiver='"+request.body.phone+"') ORDER BY messageid DESC", function (error, messages) {
		// response will be in JSON
		console.log(messages);
		result.end(JSON.stringify(messages));
	});
});



// SELECT id,name,phone,(SELECT message from chat WHERE (receiver='9567836661' and sender=user.phone) or (sender='9567836661' and receiver=user.phone) order by id desc limit 1) as message from user WHERE phone in (SELECT receiver from chat where sender='9567836661') OR phone in (SELECT sender from chat where receiver='9567836661')
//SELECT id,name,phone,(select message from chat WHERE (receiver='9567836661' and sender=user.phone) or (sender='9567836661' and receiver=user.phone) order by id desc limit 1) as message,(select id from chat WHERE (receiver='9567836661' and sender=user.phone) or (sender='9567836661' and receiver=user.phone) order by id desc limit 1) as messageid from user WHERE phone in (SELECT receiver from chat where sender='9567836661') OR phone in (SELECT sender from chat where receiver='9567836661') ORDER by messageid DESC