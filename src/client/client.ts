import { io } from "socket.io-client";
import * as PIXI from 'pixi.js';
import { BoardDisplay, DisplayMode, LevelOfDetail } from "./boardlayout";
import { appHeight, appWidth, boxHeight, boxWidth, lerp } from "./config";
import { Board } from "./board";
import { Connection } from "../server/rooms";
import { Update } from "../server/game";
import { Events } from "matter-js";
import { BloomFilter } from "pixi-filters";

import * as Shaders from "./shaders";

const room = new URLSearchParams(window.location.search).get("room");
let username = sessionStorage.getItem("username");
if (!room)
	window.location.href = "/index.html";
if (!username) 
	username = "unset"

const socket = io();
socket.emit("joinRoom", { room, username });



const app = new PIXI.Application();
const connections: Map<string, [Connection, Board]> = new Map();

(async () => {
	await app.init({ antialias: true, backgroundAlpha: 0, width: appWidth, height: appHeight });
	document.body.appendChild(app.canvas);
	app.canvas.setAttribute("id", "render");

	const displayBoard = new BoardDisplay();
	app.stage.addChild(displayBoard.container);

	const chromatic = new PIXI.Filter({
		glProgram: new PIXI.GlProgram({
			fragment: Shaders.chromatic.fragment,
			vertex: Shaders.chromatic.vertex,
		}),
		resources: {
            uniforms: {
                uResolution: { value: [app.stage.width, app.screen.height], type: 'vec2<f32>'},
                uRed: { value: [3, 0], type: 'vec2<f32>'},
                uGreen: { value: [0, 0], type: 'vec2<f32>'},
                uBlue: { value: [-6, 0], type: 'vec2<f32>'},
                uPower: { value: 2.0, type: 'f32'},
                uOffset: { value: 0.4, type: 'f32'},
                uBase: { value: 0.1, type: 'f32'},
            },
        },
	});

	app.stage.filterArea = app.screen;
	app.stage.filters = [new PIXI.BlurFilter({strength: 0}), chromatic, new BloomFilter({strength: 6})];

	let other_boards: Board[] = [];

	let myBoard: Board;
	let myConnection: Connection;

	let incomingConnections: Connection[] = [];
	socket.on("connectionAdded", (data: Connection) => {
		if (data.id !== socket.id && !connections.has(data.id)) {
			incomingConnections.push(data);
		} else {
			myConnection = data;
			if (!myConnection)
				window.location.href = "/index.html";
		
			if (!myBoard) {
				myBoard = new Board(displayBoard, LevelOfDetail.PHYSICS_WITH_HUD, true);
				myBoard.connection = myConnection;
				myBoard.focused = true;
				myBoard.client = true;
				myBoard.transform = {x: appWidth/2 - boxWidth/2, y: appHeight/2 - boxHeight/2, scale: 1};
				app.stage.addChild(myBoard.container);
				myBoard.initBoard();
				myBoard.initEngine();
				myBoard.startSim();
				connections.set(myConnection.id, [myConnection, myBoard]);

				Events.on(myBoard.engine, "collisionEnd", () => {
					// sync(true);
				});
			}
		}
	});

	function addPlayer(connection: Connection) {
		if (!connections.get(connection.id)) {
			let board = new Board(displayBoard);
			other_boards.push(board);
			displayBoard.addBoard(board);

			board.connection = connection;
			board.id = connection.num;

			board.initBoard();
			connections.set(connection.id, [connection, board]);
		}
	}

	socket.on("connectionRemoved", (data: Connection[]) => {
		const removedConnections = [];
		for (const [connectionId, connectionTuple] of connections.entries()) {
			const connection = connectionTuple[0];
			if (!data.some(newConnection => newConnection.id === connection.id)) {
				removedConnections.push(connectionId);
			}
		}
		removedConnections.forEach(connectionId => {
			displayBoard.removeBoard(connections.get(connectionId)[1]);
			connections.delete(connectionId);
		});
	});

	socket.on("playerList", (data: Connection[]) => {
		data.forEach(connection => {
			if (connection.id !== socket.id && !connections.has(connection.id)) {
				let found = false;
				incomingConnections.forEach(v => {
					if (v.id == connection.id) {
						found = true;
					}
				});
				if (!found) {
					incomingConnections.push(connection);
				}
			}
		});
	});

	app.ticker.add((time) => {
		chromatic.resources.uniforms.uniforms.uResolution = [app.stage.width, app.stage.height];

		if (myBoard)
			myBoard.draw();
		other_boards.forEach(board => {
			board.draw(time.deltaTime);
		});
	});

	function sync(volatile?: boolean) {
		let update: Update = {
			sender: myConnection.id,
			event: {
				type: "updateOthers",
				data: myBoard.exportBoard()
			},
			timestamp: Date.now()
		};
		if (volatile) {
			socket.volatile.emit("update", [room, update]);
		}
		else {
			socket.emit("update", [room, update]);
		}
	}
	
	window.addEventListener("keydown", (e) => {
		switch (e.key.toUpperCase()) {
			case "C":
				myBoard.spawnFruit();
				sync(true);
				break;
			case "S":
				sync(true);
				break;
			case "F":
				for (let i = 0; i < Math.random() * 100; i++) {
					myBoard.spawnFruit();
				}
				sync(true);
				break;
			case "V":
				for (let connection in connections) {
					console.log(connections[connection]);
				}
				break;
		}
	});

	let updates: Update[] = [];

	function handleEvents() {
		if (updates.length == 0) return;

		let update = updates.at(0);

		let board = connections.get(update.sender)[1];
		if (!connections.get(update.sender)) {
			console.log("couldn't find board?");
			return;
		}

		let now = Date.now();
		switch (update.event.type) {
			case "updateOthers": {
				// if (now - 5000 > update.timestamp) {
				// 	console.log("too old, skipping")
				// 	break;
				// }
				if (update.timestamp > board.lastUpdate) {
					board.clear();
					board.loadBoard(update.event.data);
					board.lastUpdate = update.timestamp;
				}
				// console.log("handling update");
			}
		}
		updates.splice(0, 1);
	};

	socket.on("update", (update: Update) => {
		updates = [update, ...updates];
	});
	
	setInterval(() => { 
		if (document.hasFocus()) {
			if (incomingConnections.length > 0) {
				addPlayer(incomingConnections.at(0));
				incomingConnections.splice(0, 1);
			}
			handleEvents();
		}
	}, 100);

})();