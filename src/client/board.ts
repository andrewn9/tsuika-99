import * as PIXI from 'pixi.js';
import { Engine, Runner, Render, Mouse, MouseConstraint, Composite, IChamferableBodyDefinition, Bodies, Body } from "matter-js";
import { appHeight, appWidth, boxHeight, boxWidth, clamp, lerp } from "./config";
import { Fruit, FruitType } from "./fruit";
import { BoardDisplay, DisplayMode, LevelOfDetail } from './boardlayout';
import { Connection } from '../server/rooms';
import { bodyMap } from './client';

export class Board {
	connection: Connection;
	simulationDetail = LevelOfDetail.POSITIONS;
	physicsReady = false;
	physicsRunning = false;
	client = false;
	focused = false;
	dead = false;

	fruits: Fruit[] = [];

	engine: Engine;
	runner: Runner;

	container: PIXI.Container;
	nameplate: PIXI.Text;
	boardDisplay: BoardDisplay;
	id: number;
	lastUpdate: number = 0;

	transform: {
		x: number;
		y: number;
		scale: number;
		rowIndex?: number;
	};

	textStyle = new PIXI.TextStyle({
		fontFamily: 'Arial',
		fill: '#ffffff',
		stroke: { color: '0x111111', width: 12, join: 'round' },
		fontSize: 45,
		fontWeight: 'lighter',
	});

	initBoard() {
		if (!this.container) { return; }
		let board = new PIXI.Graphics();
		
		board.stroke({ alignment: 0, width: 5, color: 0xffffff, });
		board.lineTo(0, boxHeight);
		board.lineTo(boxWidth, boxHeight);
		board.lineTo(boxWidth, 0);
		board.stroke();

		board.fillStyle = {
			color: 0x000000,
			alpha: 0.9*255
		};

		board.fill();

		let nameplate = new PIXI.Text({
			text: this.connection ? this.connection.username : "undefined",
			style: this.textStyle,
		});

		nameplate.position.x = boxWidth/2-nameplate.width/2;
		nameplate.position.y = boxHeight * 1.025;

		board.rect(0, nameplate.position.y , boxWidth,  nameplate.height * 1);
		board.fill();

		this.container.addChild(board);
		this.container.addChild(nameplate);
	}

	initEngine() {
		if (!this.engine) {
			this.engine = Engine.create({
				gravity: { x: 0, y: 1, scale: 0.002 }
			});
		}

		// var render = Render.create({
		// 	element: document.body,
		// 	engine: this.engine,
		// 	options: {
		// 		width: boxWidth,
		// 		height: boxHeight,
		// 		showAngleIndicator: true,
		// 		showBounds: true,
		// 		showVelocity: true,
		// 		showCollisions: true,
		// 		background: 'transparent',
		// 		wireframes: true,
		// 	}
		// });
		
		// render.canvas.setAttribute("id", "debug");

		// var mouse = Mouse.create(render.canvas),
		// 	mouseConstraint = MouseConstraint.create(this.engine, {
		// 		mouse: mouse,
		// 		constraint: {
		// 			stiffness: 0.2,
		// 			render: {
		// 				visible: false
		// 			}
		// 		}
		// 	});

		// Composite.add(this.engine.world, mouseConstraint)
		// render.mouse = mouse;
		// Render.run(render);

		let thickness = 150;

		let options: IChamferableBodyDefinition = {
			density: 1,
			friction: 0.5,
			restitution: 1,
			velocity: { x: 0, y: 0 },
			isStatic: true
		};

		const leftWall = Bodies.rectangle(-thickness/2, boxHeight/2 + thickness/2, thickness, boxHeight + thickness, options);
		const rightWall = Bodies.rectangle(boxWidth + thickness/2, boxHeight/2 + thickness/2, thickness, boxHeight + thickness, options);
		const floor = Bodies.rectangle(boxWidth/2, boxHeight + thickness/2, boxWidth + thickness, thickness, options);
		const box = Body.create({
			parts: [leftWall, rightWall, floor],
			isStatic: true,
			label: "box"
		});
		Composite.add(this.engine.world, box);

		if (!this.runner) {
			this.runner = Runner.create({ isFixed: true })
			this.stopSim();
		}
		this.physicsReady = true;
	}

	startSim() {
		if (!this.runner || !this.engine || this.physicsRunning) { return; }
		this.physicsRunning = true;
		Runner.run(this.runner, this.engine);
	}
	
	stopSim() {
		if (!this.runner || !this.engine || this.physicsRunning) { return; }
		this.physicsRunning = false;
		Runner.stop(this.runner);
	}

	spawnFruit() {
		let fruit = Fruit.create(Math.floor(Math.random() * 5), this, 50 + Math.floor(Math.random() * boxWidth - 50), 0);
		if (this.client) {
			bodyMap.set(fruit.body, fruit);
		}
		this.fruits.push(fruit);
	}

	drawFruits() {
		this.fruits.forEach(fruit => {
			fruit.graphic.position.x = clamp(fruit.body.position.x, 0 + fruit.graphic.width/2, boxWidth - fruit.graphic.width/2);
			fruit.graphic.position.y = (fruit.body.position.y < boxHeight - fruit.graphic.width/2) ? fruit.body.position.y : (boxHeight - fruit.graphic.width/2);
		});
	}

	draw(dt? : number) {
		if (this.focused) {
			this.container.position = {x: lerp(this.container.position.x, this.transform.x, 0.5), y: lerp(this.container.position.y, this.transform.y, 0.5)};

			if (this.boardDisplay.mode == DisplayMode.DUEL && this.boardDisplay.boards.length > 0) {
				this.transform = {x: appWidth/4 - boxWidth/2, y: appHeight/2 - boxHeight/2, scale: 1};
			} else {
				this.transform = {x: appWidth/2 - boxWidth/2, y: appHeight/2 - boxHeight/2, scale: 1};
			}
		} else {
			this.container.position = {x: lerp(this.container.position.x, this.transform.x, 0.25), y: lerp(this.container.position.y, this.transform.y, 0.25)};
			this.container.scale.set(lerp(this.container.scale._x, this.transform.scale, 0.25));

			if (this.dead) {
				this.container.alpha = lerp(this.container.alpha, 0, 0.5);
				if (this.container.alpha <= 0.1) {
					this.container.visible = false;
				}
			}

			if (this.boardDisplay.mode == DisplayMode.GALLERY) {
				if (this.transform.rowIndex % 2 == 0) {
					this.transform.x += 0.5 * dt;
				} else {
					this.transform.x -= 0.5 * dt;
				}

				if (this.container.position.y > appHeight / 2) {
					this.container.position.y += 5*Math.cos((2*Math.PI)/appWidth * this.container.position.x);
				} else {
					this.container.position.y -= 5*Math.cos((2*Math.PI)/appWidth * this.container.position.x);
				}

				if (this.container.position.x > appWidth + Math.floor(this.boardDisplay.boards.length / 4) * this.container.width - this.container.width*4.5) {
					this.container.position.x = -this.container.width;
					this.transform.x = this.container.position.x;
				}
				if (this.container.position.x < -(appWidth + Math.floor(this.boardDisplay.boards.length / 4) * this.container.width - this.container.width*4.5)) {
					this.container.position.x = this.container.width;
					this.transform.x = this.container.position.x;
				}
			}
		}
		if (this.simulationDetail == LevelOfDetail.PHYSICS || this.simulationDetail == LevelOfDetail.PHYSICS_WITH_HUD ) {
			this.drawFruits();
		}
	}
	
	clear () {
		while (this.fruits.length > 0) {
			this.fruits.at(this.fruits.length-1).remove();
			this.fruits.pop();
		}
	}

	loadBoard(packets: String[]) {
		if (!this.physicsReady && (this.simulationDetail == LevelOfDetail.PHYSICS || this.simulationDetail == LevelOfDetail.PHYSICS_WITH_HUD)) {
			this.initEngine();
		}
		packets.forEach(packet => {
			this.fruits.push(Fruit.createFromJSON(packet.toString(), this));
		});

		if (!this.physicsRunning) {
			this.startSim();
		}
	}

	exportBoard() {
		let packets: String[] = []
		for (let fruit of this.fruits) {
			packets.push(fruit.serialize());
		}
		return packets;
	}
	
	constructor(boardDisplay?: BoardDisplay, simulationDetail?: LevelOfDetail, client?: boolean) {
		this.boardDisplay = boardDisplay;
		this.id = Math.floor(1000*Math.random());
		this.client = client;
		this.transform = {x: 0, y: 0, scale: 0};
		if (simulationDetail)
			this.simulationDetail = simulationDetail;
		else if (boardDisplay) {
			switch (this.boardDisplay.mode) {
				case DisplayMode.GALLERY:
					this.simulationDetail = LevelOfDetail.POSITIONS
					break;
				case DisplayMode.TWOSIDES:
					this.simulationDetail = LevelOfDetail.POSITIONS
					break;
				case DisplayMode.ONESIDE:
					this.initEngine();
					this.simulationDetail = LevelOfDetail.PHYSICS
					break;
				case DisplayMode.DUEL:
					this.initEngine();
					this.simulationDetail = LevelOfDetail.PHYSICS_WITH_HUD
					break;
			}
		}

		this.container = new PIXI.Container();
		this.container.scale.set(1,1);
	}
}