const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const EventEmitter = require("events");
const express = require('express');
const JSONdb = require("cryptedjsondb");
const database = new JSONdb("./players.json", {
	minify: true
});
const app = express();

global.config = require("./config.json");
global.server = new EventEmitter();
global.Message = require("./DataMine.js");

function findServers(directoryPath) {
	const servers = {};

	fs.readdirSync(directoryPath).forEach(file => {
		const filePath = path.join(directoryPath, file);

		if (fs.statSync(filePath).isDirectory()) {
			if(filePath.includes("-")) return;
			const nestedServers = findServers(filePath);
			Object.keys(nestedServers).forEach(server => {
				servers[server] = (servers[server] || 0) + nestedServers[server];
			});
		} else if (path.extname(filePath) === ".js" && !filePath.includes("-")) {
			const paths = filePath.split("\\");
			const serverName = paths[paths.length - 1].replace(".js", '');
			const serverCount = require("./" + filePath);
			servers[serverName] = serverCount;
		};
	});

	return servers;
};

const directoryPath = './servers/';
const servers = findServers(directoryPath);

console.log("Loaded servers: " + chalk.green(Object.keys(servers).join(" | ")));

server.on("message", async data => {
	const { donate, clan, nick} = data.message.author;
	const { text, creationDateString } = data.message;
	const serverName = data.server.name;

	database.setValue(clan, nick, serverName, "clan");
	database.setValue(donate, nick, serverName, "donate");
	
	database.setValue(text, nick, serverName, "messages", creationDateString);
});

server.on("join", data => {
	const serverName = data.server.name;
	const creationDate = new Date();

	const displayTime = creationDate.toLocaleTimeString();
    const displayDate = creationDate.toISOString().slice(0, 10);
    const creationDateString = `[${displayDate}] [${displayTime}]`;

	database.setValue(creationDateString, data.username, serverName, "lastJoinedStr");
	database.setValue(creationDate.getTime(), data.username, serverName, "lastJoined");
});

server.on("left", data => {
	const { username } = data;
	const serverName = data.server.name;
	
	const creationDate = new Date();

	const displayTime = creationDate.toLocaleTimeString();
    const displayDate = creationDate.toISOString().slice(0, 10);
    const creationDateString = `[${displayDate}] [${displayTime}]`;

	database.setValue(creationDateString, username, serverName, "lastSessionStr");
	database.setValue(creationDate.getTime(), username, serverName, "lastSession");
});

server.on("kick", data => {
	const { username, reason, kicked_by } = data;
	const serverName = data.server.name;

	const creationDate = new Date();

	const displayTime = creationDate.toLocaleTimeString();
    const displayDate = creationDate.toISOString().slice(0, 10);
    const creationDateString = `[${displayDate}] [${displayTime}]`;

	database.setValue(reason, username, serverName, "kicks", creationDate.getTime(), "reason");
	database.setValue(kicked_by, username, serverName, "kicks", creationDate.getTime(), "kicked_by");
	database.setValue(creationDateString, username, serverName, "kicks", creationDate.getTime(), "timeStr");
});

server.on("ban", data => {
	const { username, banned_by } = data;
	const serverName = data.server.name;

	const creationDate = new Date();

	const displayTime = creationDate.toLocaleTimeString();
    const displayDate = creationDate.toISOString().slice(0, 10);
    const creationDateString = `[${displayDate}] [${displayTime}]`;

	database.setValue(banned_by, username, serverName, "bans", creationDate.getTime(), "banned_by");
	database.setValue(creationDateString, username, serverName, "bans", creationDate.getTime(), "timeStr");
});

app.get("/", function (req, res) {
	res.sendFile(__dirname + "/client/index.html");
});

app.get("/api/count", function (req, res) {
	res.send( { players: Object.keys(database.data).length, servers: Object.values(servers), networks: Object.keys(servers).length });
});

app.get("/api/player", function (req, res) {
	const name = req.headers["x-player-name"];
	if(!name) res.sendStatus(403);
	const player = database.data[name];

	if(!player) res.sendStatus(404);
	
	res.send(JSON.stringify(player));
});

app.get("/player/*", function (req, res) {
	res.sendFile(__dirname + "/client/player.html");
});

app.listen(3000);