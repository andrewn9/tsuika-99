
import { Bodies, Composite, IChamferableBodyDefinition } from "matter-js";
import * as PIXI from 'pixi.js';
import { Board } from "./board";
import { Body } from "matter-js";
import { LevelOfDetail } from "./boardlayout";

interface FruitDefinition {
	type: FruitType;
	position: { x: number, y: number };
	angle: number;
	physics?: {
		velocity: { x: number, y: number };
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
		let color = fruitColor[type];
		if (!color) {
			color = new PIXI.Color();
		}
		graphic.fill(color);
		return graphic;
	}

	static createFromJSON(jSon: string, board: Board) {
		let def: FruitDefinition = JSON.parse(jSon);
		let fruit = this.create(def.type, board, def.position.x, def.position.y, def.angle);

		if (def.physics) {
			Body.update(fruit.body, 16.666, 1, 0);
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
			position: { x: x, y: y },
			angle: angle ? angle : 0
		};

		fruit.board = board;
		fruit.graphic = this.createGraphic(type, 0, 0, fruitRadii[type]);
		fruit.board.container.addChild(fruit.graphic);

		if (angle) {
			fruit.graphic.angle = angle;
		}

		if (board.simulationDetail == LevelOfDetail.PHYSICS || board.simulationDetail == LevelOfDetail.PHYSICS_WITH_HUD) {
			fruit.body = Bodies.circle(x, y, fruitRadii[type], { isStatic: false });
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
		this.properties.position = { x: this.body.position.x, y: this.body.position.y };

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

const fruitRadii = {
	[FruitType.CHERRY]: 25,
	[FruitType.STRAWBERRY]: 35,
	[FruitType.GRAPES]: 50,
	[FruitType.DEKOPON]: 55,
	[FruitType.PERSIMMON]: 65,
	[FruitType.APPLE]: 80,
	[FruitType.PEAR]: 100,
	[FruitType.PEACH]: 120,
	[FruitType.PINEAPPLE]: 140,
	[FruitType.MELON]: 170,
	[FruitType.WATERMELON]: 200
}

const fruitColor = {
	[FruitType.CHERRY]: new PIXI.Color("#b30202"),
	[FruitType.STRAWBERRY]: new PIXI.Color("#e85151"),
	[FruitType.GRAPES]: new PIXI.Color("#a04cd9"),
	[FruitType.DEKOPON]: new PIXI.Color("#f5ab2c"),
	[FruitType.PERSIMMON]: new PIXI.Color("eb7507"),
	[FruitType.APPLE]: new PIXI.Color("#f50800"),
	[FruitType.PEAR]: new PIXI.Color("#f9ff8a"),
	[FruitType.PEACH]: new PIXI.Color("#ffa1d6"),
	[FruitType.PINEAPPLE]: new PIXI.Color("#faf200"),
	[FruitType.MELON]: new PIXI.Color("#85ff47"),
	[FruitType.WATERMELON]: new PIXI.Color("#37a102"),
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
