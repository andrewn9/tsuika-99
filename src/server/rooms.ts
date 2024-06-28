import { genBag } from "../client/fruit";
import { gameUpdate } from "./game";
import { io } from "./index";

// Interface definitions for connections and rooms
export interface Connection {
	id: string;	// socket reference
	num: number; // player #
	username: string;
	host: boolean;
}

export interface Room {
	connections: Connection[];
	readies: number;
	max_players: number;
	state: string;
	bag?: number[];
}

export const rooms: Map<string, Room> = new Map();

function findMissingNumber(arr: number[]): number {
	if (arr.length < 1) {
		return 0;
	}
	for (let i = 0; i < arr.length; i++) {
		if (arr[i] !== i) {
			return i;
		}
	}
	return arr.length;
}

export function joinRoom(socket: any, room: string, username: string) {
	if (!rooms.has(room)) {
		rooms.set(room, {
			connections: [],
			readies: 0,
			max_players: 100,
			state: "waitingForPlayers",
			bag: genBag(50)
		});
	}

	const roomData = rooms.get(room)!;
	const connections = roomData.connections;
	const gameState = roomData.state;

	if (connections.length == roomData.max_players) {
		return;
	}

	// Assign player number
	let nums = [] as number[];
	connections.forEach(connection => {
		nums.push(connection.num);
	});

	let pnum = findMissingNumber(nums);
	let newConnection = { // Push new connection
		id: socket.id,
		num: pnum,
		username: username,
		host: connections.length == 0
	};
	connections.push(newConnection);

	// Connect to room and send/recieve updates
	socket.join(room);
	io.to(room).emit("connectionAdded", newConnection);
	io.to(room).emit("playerList", roomData.connections);
	io.to(room).emit("bagUpdate", roomData.bag);
};

function getAvailableRooms(): { roomname: string; capacity: string; host: string; state: string }[] {
	const data: { roomname: string; capacity: string; host: string, state: string }[] = [];

	rooms.forEach((roomData, room) => {
		let hostname;
		for (let connection of roomData.connections) {
			if (connection.host)
				hostname = connection.username;
		}
		data.push({
			roomname: room,
			capacity: roomData.connections.length.toString() + "/" + roomData.max_players,
			state: roomData.state,
			host: hostname
		});
	});

	return data;
}

const disconnectPlayer = (socket) => {
	rooms.forEach((roomData, room) => {
		const players = roomData.connections;
		const playerIndex = players.findIndex((player) => player.id === socket.id);
		if (playerIndex !== -1) {
			console.log("user disconnected", socket.id);
			rooms.get(room)!.state = "paused";
			players.splice(playerIndex, 1);
			io.to(room).emit("connectionRemoved", players);
			if (players.length === 0) {
				rooms.delete(room);
				console.log(`Room ${room} is empty and has been deleted.`);
			}
		}
	});
};

io.on("connection", (socket) => {
	socket.on("joinRoom", (data) => {
		const room = data.room;
		const username = data.username;
		joinRoom(socket, room, username);
	});

	socket.on("update", (data) => {
		gameUpdate(socket, data);
	});

	socket.on("ready", (data) => {
		let room = rooms.get(data[0]);
		room.readies++;
		if (room.readies === room.max_players)
		{
			socket.to(data[0]).emit("start");
		}
	});

	socket.on("queryRooms", () => {
		socket.emit('updateRooms', getAvailableRooms());
	});

	socket.on("disconnect", () => {
		disconnectPlayer(socket);
	});
});