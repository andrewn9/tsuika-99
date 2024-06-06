import { io } from "socket.io-client";
import * as PIXI from 'pixi.js';
import { BoardDisplay, DisplayMode, LevelOfDetail } from "./boardlayout";
import { appHeight, appWidth, boxHeight, boxWidth, lerp } from "./config";
import { Board } from "./board";
import { Connection } from "../server/rooms";
import { Update } from "../server/game";

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

	let other_boards: Board[] = [];


	let myBoard: Board;
	let myConnection: Connection;
	socket.on("connectionAdded", (data: Connection[]) => {
		for (let connection of data) {
			if (!connections.get(connection.id)) {
				console.log("connectionid" + connection.id);

				if (connection.id === socket.id) {
					myBoard = new Board(displayBoard, LevelOfDetail.PHYSICS_WITH_HUD, true);
					myBoard.connection = connection;

					myBoard.focused = true;
					myBoard.client = true;

					myBoard.transform = {x: appWidth/2 - boxWidth/2, y: appHeight/2 - boxHeight/2, scale: 1};
					app.stage.addChild(myBoard.container);

					myBoard.initBoard();
					myBoard.initEngine();
					myBoard.startSim();
					connections.set(connection.id, [connection, myBoard]);
				} else {
					let board = new Board(displayBoard);
					other_boards.push(board);
					displayBoard.addBoard(board);

					board.connection = connection;
					board.id = connection.num;

					board.initBoard();
					connections.set(connection.id, [connection, board]);
				}
			}
		}
		if (!myBoard) {
			window.location.href = "/index.html";
		}
		myConnection = myBoard.connection
		sync();
	});


	
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


	app.ticker.add((time) => {
		if (myBoard)
			myBoard.draw();
		other_boards.forEach(board => {
			board.draw(time.deltaTime);
		});
	});

	setInterval(() => { if (document.hasFocus()) {sync(true);} }, 3000);

	function sync(volatile?: boolean) {
		let update: Update = {
			sender: myConnection.id,
			event: {
				type: "updateOthers",
				data: myBoard.exportBoard()
			}
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
			case "A":
				let board = new Board(displayBoard);
				other_boards.push(board);
				displayBoard.addBoard(board);
				break;
			case "C":
				myBoard.spawnFruit();
				break;
			case "S":
				sync(true);
				break;
			case "F":
				for (let i = 0; i < Math.random() * 100; i++) {
					myBoard.spawnFruit();
				}
				break;
		}
	});


	socket.on("update", (update: Update) => {
		let board = connections.get(update.sender)[1];
		switch (update.event.type) {
			case "updateOthers": {
				board.clear();
				board.loadBoard(update.event.data);
			}
		}
	});

})();

