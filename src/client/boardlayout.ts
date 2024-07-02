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

	focused: Board;

	constructor() {
		this.container = new PIXI.Container();
	}

	getMode() {
		console.log(this.boards.length);

		if (this.boards.length > 48) {
			return DisplayMode.GALLERY;
		} else if (this.boards.length > 24) {
			return DisplayMode.TWOSIDES;
		} else if (this.boards.length > 2) {
			return DisplayMode.ONESIDE;
		} else {
			return DisplayMode.DUEL;
		}
	}

	addBoard(board: Board) {
		this.boards.push(board);
		this.container.addChild(board.container);
		this.mode = this.getMode();
		this.arrangeBoards();
	}

	removeBoard(board: Board) {
		for (let i = 0; i < this.boards.length; i++) {
			if (this.boards[i] === board) {
				this.boards[i].transform.y = this.boards[i].transform.y + 50;
				this.boards[i].dead = true;
				this.boards[i].stopSim();
				this.boards.splice(i, 1);

				if (!(this.getMode() == DisplayMode.GALLERY && DisplayMode.GALLERY == this.mode)) {
					this.mode = this.getMode();
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

		let scaleFactor = 1;
		let margin = 100;
		switch (this.mode) {
			case DisplayMode.GALLERY:
				break;
			case DisplayMode.TWOSIDES:

				break;
			case DisplayMode.ONESIDE:
				let view_width = boxWidth;
				let view_height = boxHeight;

				let grid = this.boards.filter(board => board !== this.focused);

				let k = boxHeight/boxWidth;
				let columns = Math.floor(Math.sqrt(k*grid.length));
				let rows = Math.ceil(grid.length/columns);

				console.log("rows:" + rows);
				console.log("columns:" + columns);

				scaleFactor = Math.min(view_height / (rows * boxHeight), view_width / (columns * boxWidth));
				// scaleFactor = view_height / (rows * boxHeight);

				let scaledWidth = boxWidth * scaleFactor;
				let scaledHeight = boxHeight * scaleFactor;

				for (let i = 0; i < grid.length; i++) {
					let board = grid[i];

					const colIndex = i % columns + 0.5;
					const rowIndex = Math.floor(i / columns) + 0.5;

					board.transform.x = (colIndex - columns / 2) * scaledWidth + (boxWidth + columns * scaledWidth)/2;
					board.transform.y = (rowIndex - rows / 2) * scaledHeight;

					board.transform.scale = scaleFactor;
				}

				this.focused.transform.x = 0;
				this.focused.transform.scale = 1;

				break;
			case DisplayMode.DUEL:
				scaleFactor = 1;

				for (let i = 0; i < this.boards.length; i++) {
					let board = this.boards[i];

					board.transform.x = (i + 0.5 - this.boards.length / 2) * (boxWidth + margin);
				}

				break;
			default:
				break;
		}

		// let bwidth = boxWidth * scaleFactor;
		// let bheight = boxHeight * scaleFactor;

		// let columns = Math.ceil(bounds.width / bwidth);
		// let rows = Math.ceil(bounds.height / bheight);


		// if (this.mode == DisplayMode.TWOSIDES) {
		// 	let mid = Math.floor(this.boards.length / 2);

		// 	for (let i = 0; i < mid; i++) {
		// 		let board = this.boards[i];
		// 		const colIndex = i % columns;
		// 		const rowIndex = Math.floor(i / columns);
		// 		board.transform.x = bounds.x + colIndex * (bwidth + margin);
		// 		board.transform.y = bounds.y + rowIndex * (bheight + margin);
		// 	}

		// 	bounds.x = appWidth / 2 + boxWidth / 2 + margin * 5;

		// 	for (let i = mid; i < this.boards.length; i++) {
		// 		let board = this.boards[i];
		// 		const colIndex = i % columns;
		// 		const rowIndex = Math.floor((i - mid) / columns);
		// 		board.transform.x = bounds.x + colIndex * (bwidth + margin);
		// 		board.transform.y = bounds.y + rowIndex * (bheight + margin);
		// 	}

		// } else if (this.mode == DisplayMode.GALLERY) {
		// 	for (let i = 0; i < this.boards.length; i++) {
		// 		let board = this.boards[i];
		// 		const rowIndex = i % 4;
		// 		const colIndex = Math.floor(i / 4);
		// 		board.transform.x = bounds.x + colIndex * (bwidth + margin);

		// 		if (rowIndex % 2 == 0) {
		// 			board.transform.x += 1 * bwidth / 2;
		// 			board.transform.rowIndex = rowIndex;
		// 		}

		// 		board.transform.y = bounds.y + rowIndex * (bheight + margin);
		// 	}
		// } else if (this.mode == DisplayMode.ONESIDE) {
		// 	for (let i = 0; i < this.boards.length; i++) {
		// 		let board = this.boards[i];
		// 		const colIndex = i % columns;
		// 		const rowIndex = Math.floor(i / columns);
		// 		board.transform.x = bounds.x + colIndex * (bwidth + margin);
		// 		board.transform.y = bounds.y + rowIndex * (bheight + margin);
		// 	}
		// }
	}
}