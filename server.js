const express = require('express');
const app = express();
const http = require('http');

const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const { InMemorySessionStore } = require("./server/sessionStore.js");
const sessionStore = new InMemorySessionStore();

app.use(express.static('public'));

app.get('/', (req, res) => {
	res.sendFile(__dirname + '/static/index.html');
});

app.get('/host', (req, res) => {
	res.sendFile(__dirname + '/static/host.html');
});

randomizeArray = unshuffledArr => {
	const shuffledArr = unshuffledArr.slice()
	for (let i = shuffledArr.length - 1; i > 0; i--) {
		const rand = Math.floor(Math.random() * (i + 1));
		[shuffledArr[i], shuffledArr[rand]] = [shuffledArr[rand], shuffledArr[i]];
	}
	return shuffledArr
}

informAllUsers = () => {
	io.emit('return-all-users', {
		users: sessionStore.findAllSessions()
	})
}

io.on('connection', socket => {
	socket.on("local-storage-session", clientObj => {
		const { id } = clientObj
		if(!id){
			// New user (no session saved client side)
			socket.emit('use-provided-session', socket.id)

			sessionStore.saveSession(socket.id, {
				username: socket.username,
				id: socket.id,
				connected: true
			});
		} else if(!sessionStore.findSession(id)){
			// Situation where the server has died but the clients have some info
			socket.emit('use-provided-session', socket.id)
			sessionStore.saveSession(socket.id, {
				username: socket.username,
				id: socket.id,
				connected: true
			});
		} else {
			const userSessionObj = sessionStore.findSession(id);
			userSessionObj.connected = true;
		}

		// Update the host of new users
		informAllUsers()
	});

	socket.emit("session", {
		sessionID: socket.id
	});

	socket.on('name-change', obj => {
		const userSessionObj = sessionStore.findSession(obj.id);
		if(userSessionObj){
			userSessionObj.username = obj.name;
		}

		// Update the host of new users
		informAllUsers()
	});

	socket.on('get-all-users', () => {
		socket.emit('return-all-users', {
			users: sessionStore.findAllSessions()
		})
	})

	socket.on('remove-user', id => {
		sessionStore.endSession(id)
		socket.to(id).emit('end-client-session', id)
		// Update the host of new users
		informAllUsers()
	})

	socket.on('start-yankee-swap', () => {
		const arr = sessionStore.findAllSessions().map((session, index) => {
			const { id } = session
			return {
				id,
				index,
			}
		})
		const randomizedArr = randomizeArray(arr)
		io.emit('randomized-users', {
			result: randomizedArr	
		})
	})

	socket.on('reset-everything', () => {
		const sessionArr = sessionStore.findAllSessions()
		sessionArr.forEach(sessionObj => {
			const { id } = sessionObj
			sessionStore.endSession(id)
			socket.to(id).emit('end-client-session', id)
		})
	})
	
	socket.on('disconnect', () => {
		const userSessionObj = sessionStore.findSession(socket.id)
		if(userSessionObj){
			userSessionObj.connected = false;
		}
	});
});

server.listen(process.env.PORT || 3000, () => {
	console.log(`listening on *:${process.env.PORT || 3000}`);
})