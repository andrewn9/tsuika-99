import * as PIXI from 'pixi.js';
import { appHeight, appWidth, boxHeight, boxWidth } from './config';
import { Board } from './board';

export enum DisplayMode {
	GALLERY,
	TWOSIDES,
	ONESIDE,
	DUEL
}

export enum LevelOfDetail {
	POSITIONS,
	PHYSICS,
	PHYSICS_WITH_HUD
}

export class BoardDisplay {
	boards: Board[] = [];
	mode: DisplayMode = DisplayMode.DUEL;
	container: PIXI.Container;

	constructor() {
		this.container = new PIXI.Container();
	}

	updateMode() {
		if (this.boards.length > 48) {
			this.mode = DisplayMode.GALLERY;
		} else if (this.boards.length > 24) {
			this.mode = DisplayMode.TWOSIDES;
		} else if (this.boards.length > 1) {
			this.mode = DisplayMode.ONESIDE;
		} else {
			this.mode = DisplayMode.DUEL;
		}
	}

	addBoard(board: Board) {
		this.boards.push(board);
		this.container.addChild(board.container);
		this.updateMode();
		this.arrangeBoards();
	}

	removeBoard(board: Board) {
		for (let i = 0; i < this.boards.length; i++) {
			if (this.boards[i] === board) {
				this.boards[i].transform.y = this.boards[i].transform.y + 50;
				this.boards[i].dead = true;
				this.boards.splice(i, 1);
				if (this.mode !== DisplayMode.GALLERY && this.boards.length < 49) {
					this.updateMode();
					this.arrangeBoards();
				}
				return;
			}
		}
	}

	arrangeBoards() {
		let bounds = {
			x: 0,
			y: 0,
			width: 0,
			height: 0
		};

		let scaleFactor;
		let margin = 5;
		switch (this.mode) {
			case DisplayMode.GALLERY:
				margin = 50;
				bounds.height = appHeight * 0.8;
				scaleFactor = (appHeight / 4 - 2 * margin) / (boxHeight);
				bounds.y = appHeight / 2 - boxHeight * scaleFactor * 2 - margin;
				break;
			case DisplayMode.TWOSIDES:
				scaleFactor = 1 / 6;
				margin = 10;
				bounds.width = appWidth * 0.2;
				bounds.height = appHeight * 0.5;
				bounds.x = margin * 5;
				bounds.y = appHeight / 2 - boxHeight / 2;
				break;
			case DisplayMode.ONESIDE:
				if (this.boards.length < 5) {
					scaleFactor = 1/3;
				} else if (this.boards.length < 15) {
					scaleFactor = 1/5;
				} else {
					scaleFactor = 1/6;
				}
				margin = 10;
				bounds.width = appWidth * 0.2;
				bounds.height = appHeight * 0.5;
				bounds.x = appWidth / 2 + boxWidth / 2 + margin * 5;
				bounds.y = appHeight / 2 - boxHeight / 2;
				break;
			case DisplayMode.DUEL:
				scaleFactor = 1;
				margin = 0;
				bounds.width = boxWidth;
				bounds.height = boxHeight;
				bounds.x = 3 * appWidth / 4 - boxWidth / 2;
				bounds.y = appHeight / 2 - boxHeight / 2;
				break;
			default:
				break;
		}

		this.boards.forEach(board => {
			board.transform.scale = scaleFactor;
		});

		let bwidth = boxWidth * scaleFactor;
		let bheight = boxHeight * scaleFactor;

		let columns = Math.ceil(bounds.width / bwidth);
		let rows = Math.ceil(bounds.height / bheight);


		if (this.mode == DisplayMode.TWOSIDES) {
			let mid = Math.floor(this.boards.length / 2);

			for (let i = 0; i < mid; i++) {
				let board = this.boards[i];
				const colIndex = i % columns;
				const rowIndex = Math.floor(i / columns);
				board.transform.x = bounds.x + colIndex * (bwidth + margin);
				board.transform.y = bounds.y + rowIndex * (bheight + margin);
			}

			bounds.x = appWidth / 2 + boxWidth / 2 + margin * 5;

			for (let i = mid; i < this.boards.length; i++) {
				let board = this.boards[i];
				const colIndex = i % columns;
				const rowIndex = Math.floor((i - mid) / columns);
				board.transform.x = bounds.x + colIndex * (bwidth + margin);
				board.transform.y = bounds.y + rowIndex * (bheight + margin);
			}

		} else if (this.mode == DisplayMode.GALLERY) {
			for (let i = 0; i < this.boards.length; i++) {
				let board = this.boards[i];
				const rowIndex = i % 4;
				const colIndex = Math.floor(i / 4);
				board.transform.x = bounds.x + colIndex * (bwidth + margin);

				if (rowIndex % 2 == 0) {
					board.transform.x += 1 * bwidth / 2;
					board.transform.rowIndex = rowIndex;
				}

				board.transform.y = bounds.y + rowIndex * (bheight + margin);
			}
		} else {
			for (let i = 0; i < this.boards.length; i++) {
				let board = this.boards[i];
				const colIndex = i % columns;
				const rowIndex = Math.floor(i / columns);
				board.transform.x = bounds.x + colIndex * (bwidth + margin);
				board.transform.y = bounds.y + rowIndex * (bheight + margin);
			}
		}

	}
}