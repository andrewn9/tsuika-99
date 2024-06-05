
import { Bodies, Composite, IChamferableBodyDefinition } from "matter-js";
import * as PIXI from 'pixi.js';
import { Board } from "./board";
import { Body } from "matter-js";
import { LevelOfDetail } from "./boardlayout";

function getRadius(type: FruitType) {
	let radius = (Math.pow(type, 1.36) * 5.45 + 36.52) / 2;
	return radius;
}

interface FruitDefinition {
	type: FruitType;
	position: {x: number, y: number};
	angle: number;
	physics?: {
		velocity: {x: number, y: number};
		angularVelocity: number;
	};
}

export class Fruit {
	board: Board;
	body: Body;
	graphic: PIXI.Graphics;
	properties: FruitDefinition;

	static createGraphic(type: FruitType, x: number, y: number, circleRadius: number): PIXI.Graphics {
		let graphic = new PIXI.Graphics();
		graphic.circle(x, y, circleRadius);
		graphic.fill(0xffffff);
		return graphic;
	}
	
	static createFromJSON(jSon: string, board: Board) {
		let def: FruitDefinition = JSON.parse(jSon);
		let fruit = this.create(def.type, board, def.position.x, def.position.y, def.angle);
		
		if (def.physics) {
			for (const key in def.physics) {
				Body.set(fruit.body, key, def.physics[key]);
			}
		}

		return fruit;
	}

	static create(type: FruitType, board: Board, x: number, y: number, angle?: number): Fruit {
		let fruit = new Fruit();
		fruit.properties = {
			type: type,
			position: {x: x, y: y},
			angle: angle ? angle: 0
		};

		fruit.board = board;
		fruit.graphic = this.createGraphic(type, 0, 0, getRadius(type));
		fruit.board.container.addChild(fruit.graphic);

		if (angle) {
			fruit.graphic.angle = angle;
		}

		if (board.simulationDetail == LevelOfDetail.PHYSICS || board.simulationDetail == LevelOfDetail.PHYSICS_WITH_HUD) {
			fruit.body = Bodies.circle(x, y, getRadius(type), { isStatic: false });
			Composite.add(board.engine.world, fruit.body);
		}

		return fruit;
	}

	remove() {
		this.board.container.removeChild(this.graphic);
		if (this.body && this.board.engine) {
			Composite.remove(this.board.engine.world, this.body);
		}
	}

	serialize() {
		this.properties.angle = this.body.angle;
		this.properties.position = {x: this.body.position.x, y: this.body.position.y};

		this.properties.physics = {
			velocity: this.body.velocity,
			angularVelocity: this.body.angularVelocity
		};

		return JSON.stringify(this.properties);
	}
}

export enum FruitType {
	CHERRY,
	STRAWBERRY,
	GRAPES,
	DEKOPON,
	PERSIMMON,
	APPLE,
	PEAR,
	PEACH,
	PINEAPPLE,
	MELON,
	WATERMELON
}

export const pointValues: number[] = [
	1,
	3,
	6,
	10,
	15,
	21,
	28,
	36,
	45,
	55,
	66
];

export const default_def: IChamferableBodyDefinition = {
	slop: 0.3,
	restitution: 0.25,
	angle: -Math.PI / 4,
	angularVelocity: 0,
	isStatic: false
};

export function genBag(n: number) {
	return new Array(n).fill(0).map(() => Math.floor(Math.random() * 5));
}
