/* abstract */ class SessionStore {
	findSession(id) {}
	saveSession(id, session) {}
	endSession(id) {}
	findAllSessions() {}
}

class InMemorySessionStore extends SessionStore {
	constructor() {
		super();
		// this.sessions = {}
		this.sessions = new Map();
	}

	findSession(id) {
		// return this.sessions[id]
		return this.sessions.get(id);
	}

	saveSession(id, session) {
		// this.sessions[id] = session
		// console.log(id, this.sessions[id])
		this.sessions.set(id, session);
	}

	endSession(id) {
		this.sessions.delete(id)
	}

	findAllSessions() {
		// return Object.keys(this.sessions).map(key => ({ [key]: this.sessions[key] }), this)
		return [...this.sessions.values()];
	}
}

module.exports = {
	InMemorySessionStore
};