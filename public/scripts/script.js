var socket = io();

var form = document.getElementById('form');
var input = document.getElementById('name');

const startGame = document.getElementById('startYankeeSwap')
const resetGame = document.getElementById('reset')

let localStorageSessionID = localStorage.getItem("sessionID");
const localStorageUsername = localStorage.getItem("username");
let providedSessionID = ""
let currentContentShown = ""
let timer
let countdownNum = 3

// if the user has already inputted their name then use the local storage
input.value = localStorageUsername;

removeButtonHandler = evt => {
	const id = evt.target.dataset.attr;
	socket.emit('remove-user', id)
}

showContent = id => {
	document.getElementById('popup').className = ""
	if(currentContentShown) {
		document.getElementById(currentContentShown).className = "hide"
	}
	document.getElementById(id).className = "fade-in"
	currentContentShown = id
	document.getElementById('content').className = "hide"
}

initalizeCountdown = () => {
	timer = setInterval(updateText, 1500)
}

updateText = () => {
	if(countdownNum === 1) {
		clearInterval(timer)
		setTimeout(finalReveal, 500)
	} else {
		countdownNum = countdownNum - 1;
		const countdownElem = document.getElementById('countdown')
		countdownElem.className = ""
		countdownElem.innerHTML = countdownNum
		setTimeout(() => {
			countdownElem.className = "fade-in scale-down"
		}, 100)
	}
}

finalReveal = () => {
	showContent('final')
}

socket.on("session", ({ sessionID }) => {
	// attach the session ID to the next reconnection attempts
	let host = false
	// use the Start Game button to tell if the user is a host or not
	if (startGame) {
		host = true;
	}
	socket.emit("local-storage-session", { id: localStorageSessionID, isHost: host } )
	providedSessionID = sessionID

	if(localStorageUsername) {
		socket.emit('name-change', {
			id: localStorageSessionID,
			name: localStorageUsername
		});
		document.getElementById("waiting").className = "fade-in"
	}
});

socket.on("use-provided-session", id => {
	localStorageSessionID = id ? id : providedSessionID
	localStorage.setItem("sessionID", localStorageSessionID);
});

socket.on('return-all-users', userData => {
	const table = document.getElementById('userList')
	if(table) {
		// clear all of the child elements
		table.innerHTML = "";

		const { users } = userData

		// Create the Headers
		const tableRowHeader = document.createElement('tr');
		const usernameColHeader = document.createElement('th');
		usernameColHeader.innerHTML = "Username"
		const connectedColHeader = document.createElement('th');
		connectedColHeader.innerHTML = "Connected"
		const buttonColHeader = document.createElement('th');
		buttonColHeader.innerHTML = "Remove?"

		tableRowHeader.appendChild(usernameColHeader);
		tableRowHeader.appendChild(connectedColHeader);
		tableRowHeader.appendChild(buttonColHeader);
		table.appendChild(tableRowHeader);

		// Create the rows
		users.forEach(user => {
			const { id, username, connected } = user
			const row = document.createElement('tr');
			row.id = id
			const usernameCell = document.createElement('td');
			usernameCell.innerHTML = username
			const connectedCell = document.createElement('td');
			connectedCell.innerHTML = connected ? "Connected" : "Disconnected"
			connectedCell.className = connected ? "connected" : "disconnected"
			const buttonCell = document.createElement('td');
			const button = document.createElement('button');
			button.innerHTML = "Remove"
			button.dataset.attr = id;
			button.addEventListener('click', removeButtonHandler)
			buttonCell.appendChild(button)

			row.appendChild(usernameCell);
			row.appendChild(connectedCell);
			row.appendChild(buttonCell);
			table.appendChild(row);
		})
	}
})

socket.emit('get-all-users') 

socket.on('end-client-session', id => {
	if(localStorageSessionID === id) {
		localStorage.clear()
		input.value = ""
		socket.disconnect()
		showContent('popup')
	}
})

form.addEventListener('submit', function(e) {
	e.preventDefault();
	if (input.value) {
		socket.emit('name-change', {
			id: localStorageSessionID,
			name: input.value
		});
		localStorage.setItem("username", input.value);
		document.getElementById("waiting").className = "fade-in-text"
	}
});

socket.on('randomized-users', resultObj => {
	const { result } = resultObj
	const { index } = result.find(obj => obj.id === localStorageSessionID)
	document.getElementById('number').innerHTML = Number(index) + 1;

	// Start the Countdown
	showContent('intersticial')
	initalizeCountdown()
})

if(startGame){
	startGame.addEventListener('click', evt => {
		socket.emit('start-yankee-swap')
	})
}

if(resetGame){
	resetGame.addEventListener('click', evt => {
		socket.emit('reset-everything')
	})
}