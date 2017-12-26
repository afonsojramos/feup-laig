"user strict";

class MyServer {
	constructor(url, port) {
		this.player = {};
		this.nextPlayer = {};
		this.moves = []; //the moves done so far
		this.board = []; //the game board
		this.availableColors = [];
		//defaults
		this.port = port || 8081;
		this.url = url || 'http://localhost:';
		this.url += this.port + "/";
		//utils
		this.color = false;
		this.gameType = "";
	}

	// start a new humanVhuman game - bool
	async initHvH() {
		this.gameType = "humanVhuman";
		let start = await this.sendCommand(`init(${this.gameType})`);
		await this.updateState();
		return start == "success";
	}
	// start a new humanVbot game - bool - botLevel(random, greedy, number)
	async initHvB(botLevel) {
		this.gameType = "humanVbot";
		let start = await this.sendCommand(`init(${this.gameType},${botLevel})`);
		await this.updateState();
		return start == "success";
	}
	// start a new botVbot game - bool - botLevel(random, greedy, number)
	async initBvB(bot1Level, bot2Level) {
		this.gameType = "botVbot";
		let start = await this.sendCommand(`init(${this.gameType},${bot1Level},${bot2Level})`);
		await this.updateState();
		return start == "success";
	}

	// move - true or error message
	async move(Xf, Yf, Xt, Yt) {
		let response = await this.sendCommand(`action(move,${Xf},${Yf},${Xt},${Yt})`);
		await this.updateState();
		return this.saveMoveResponse(response);
	}

	// claim - true or error message
	async claim(color) {
		self = this;
		return new Promise(function (resolve, reject) {
			self.sendCommandExpectSuccess(`action(claim,${color})`).then((value) => {
				if (value) self.color = color;
				resolve(value);
			});
		});
	}

	//update board
	async updateState() {
		this.board = this.parseList(await this.sendCommand("query(board)"));
		this.availableColors = this.parseList(await this.sendCommand("query(availableColors)"));
		this.nextPlayer = this.player;
		this.player = {
			name: await this.sendCommand("query(player)"),
			colors: this.parseList(await this.sendCommand("query(colors)")),
			stacks: this.parseList(await this.sendCommand("query(stacks)")),
			score: await this.sendCommand("query(score)")
		};
	}

	// undo move
	async undo() {
		return await this.sendCommandExpectSuccess("action(undo)");
	}

	// is the next player from a bot
	isBotNext() {
		return this.gameType == "botVbot" || this.gameType == "humanVbot" && this.player.name[0] == "p";
	}

	// make the bot move
	async playBot() {
		let response = await this.sendCommand(`action(playBot)`);
		await this.updateState();
		return this.saveMoveResponse(response);
	}

	async sendCommandExpectSuccess(command) {
		let response = await this.sendCommand(command);
		if (response == "success") return true;
		return response;
	}

	// save a move response into the moves - true or error message
	saveMoveResponse(response) {
		let parts = response.split("+");
		if (parts[0] != "success") return response;
		let coords = parts[1].split("-");
		if (parts.length == 4 && parts[3] != "none") this.color = parts[3]; //bot move comes with extra info
		this.moves.push({
			Xf: coords[0],
			Yf: coords[1],
			Xt: coords[2],
			Yt: coords[3],
			removed: this.parseList(parts[2]),
			color: this.color
		});
		if (this.color) this.player.colors.push(this.color);
		this.color = false;
		return true;
	}

	// send command
	async sendCommand(command) {
		self = this;
		return new Promise(function (resolve, reject) {
			var request = new XMLHttpRequest();
			request.open('GET', self.url + command, true);
			let res;
			request.onload = function (data) {
				console.log("[" + command + "]: " + data.target.response);
				resolve(data.target.response);
			};
			request.onerror = function () {
				console.log("Error waiting for response(" + command + ")");
				resolve(false);
			};
			request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
			request.send();
		});
	}

	//parse a prolog list into an array (atoms are strings)
	parseList(list) {
		list = list.replace(/\s+/g, '');
		let res = [
			[]
		];
		let level = 0; //level in the list
		let i = 0; // string index
		let string;
		while (i < list.length) {
			if (list[i] == "[") { //one level in
				res[++level] = []; //new array
				string = "";
			} else if (list[i] == "]") { //one level out
				if (string != "") res[level].push(string);
				string = "";
				res[--level].push(res[level + 1]);
				res.splice(level + 1, 1);
			} else if (list[i] == ",") { //same level, next list
				if (string != "") res[level].push(string);
				string = "";
			} else { //element inside t
				string += list[i];
			}
			i++; //next char
		}
		return res[0][0];
	}
}