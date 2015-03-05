"use strict";


// symbolic constants for indices of the x, y and z axis
var AXIS_X = 0, AXIS_Y = 1, AXIS_Z = 2; 
var AXES = [AXIS_X, AXIS_Y, AXIS_Z];
// a direction is an axis with a sign
var DIRECTIONS = [];
for (var axis of AXES) {
	for (var sign of [-1, 1]) {
		DIRECTIONS.push({axis:axis, sign:sign});
	}
}

// getting a right system of three axes starting with the given one
function nextAxis(axis) {
	switch(axis) {
		case AXIS_X: return AXIS_Y;
		case AXIS_Y: return AXIS_Z;
		case AXIS_Z: return AXIS_X;
		default: throw new Error("no axis index: "+axis);
	}
}
function afterNextAxis(axis) {
	switch(axis) {
		case AXIS_X: return AXIS_Z;
		case AXIS_Y: return AXIS_X;
		case AXIS_Z: return AXIS_Y;
		default: throw new Error("no axis index: "+axis);
	}
}

// rotating a direction 90 degrees around an axis
function rotateDirection(dir, rotAxis, rotSign) {
	if (dir.axis==nextAxis(rotAxis)) {
		return {axis:afterNextAxis(rotAxis), sign:(rotSign*dir.sign)};
	}
	if (dir.axis==afterNextAxis(rotAxis)) {
		return {axis:nextAxis(rotAxis), sign:(-rotSign*dir.sign)};
	}
	return dir;
}


// --------------------
// the cube piece class
// --------------------
function Piece() {
	this.faceColors=[];
	for (var axis of AXES) {
		this.faceColors[axis] = [];
		for (var sign of [-1, 1]) {
			this.faceColors[axis][sign] = -1;
		}
	}
}
Piece.prototype.getFaceColor = function(direction) {
	return this.faceColors[direction.axis][direction.sign];
}
Piece.prototype.setFaceColor = function(direction, colorIndex) {
	this.faceColors[direction.axis][direction.sign] = colorIndex;
}
Piece.prototype.rotate = function(rotAxis, rotSign) {
	var result = new Piece();
	for (var dir of DIRECTIONS) {
		result.setFaceColor(rotateDirection(dir, rotAxis, rotSign),
			this.getFaceColor(dir));
	}
	return result;
}


// --------------
// the cube class
// --------------
function Cube() {
	this.pieces=[];
	for (var x=-1; x<=1; x++) {
		this.pieces[x] = [];
		for (var y=-1; y<=1; y++) {
			this.pieces[x][y] = [];
			for (var z=-1; z<=1; z++) {
				this.pieces[x][y][z] = new Piece();
			}
		}
	}
}
Cube.prototype.getPiece = function(pos) {
	return this.pieces[pos.x][pos.y][pos.z];
}
Cube.prototype.setPiece = function(pos, piece) {
	this.pieces[pos.x][pos.y][pos.z] = piece;
}
// the nine piece positions in a plane of the cube
// -- index is the common coordinate of the pieces in that plane: -1, 0 or 1
Cube.prototype.plane = function(axis, index) {
	var positions = [];
	var pos = [];
	var axis1 = nextAxis(axis), axis2 = afterNextAxis(axis);
	pos[axis] = index;
	for (pos[axis1]=-1; pos[axis1]<=1; pos[axis1]++) {
		for (pos[axis2]=-1; pos[axis2]<=1; pos[axis2]++) {
			positions.push({x:pos[AXIS_X], y:pos[AXIS_Y], z:pos[AXIS_Z]});
		}
	}
	return positions;
}
// set the face colors to the initial/winning state
Cube.prototype.reset = function() {
	// iterate over the six cube faces
	for (var i=0; i<6; i++) {
		var dir = DIRECTIONS[i];
		// iterate over the nine pieces with faces in this direction
		for (var pos of this.plane(dir.axis, dir.sign)) {
			var piece = this.getPiece(pos);
			piece.setFaceColor(dir, i);
			this.setPiece(pos, piece);
		}
	}
}
// render the whole cube
Cube.prototype.render = function(mvMatrix) {
	var pieceInterval = pieceSize*1.02;
	for (var x=-1; x<=1; x++) {
		for (var y=-1; y<=1; y++) {
			for (var z=-1; z<=1; z++) {
				renderPiece(matTranslate(mvMatrix,
						x*pieceInterval,
						y*pieceInterval,
						z*pieceInterval),
					this.pieces[x][y][z]);
			}
		}
	}
	
}
