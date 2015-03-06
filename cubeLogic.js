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
		default: throw new Error("not an axis index: "+axis);
	}
}
function afterNextAxis(axis) {
	switch(axis) {
		case AXIS_X: return AXIS_Z;
		case AXIS_Y: return AXIS_X;
		case AXIS_Z: return AXIS_Y;
		default: throw new Error("not an axis index: "+axis);
	}
}
// turn an axis index into the corresponding attribute name string
function axisToString(axis) {
	switch (axis) {
		case AXIS_X: return "x";
		case AXIS_Y: return "y";
		case AXIS_Z: return "z";
		default: throw new Error("not an axis index: "+axis);
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

// rotating a position (integral vector) 90 degrees around an axis
function rotatePosition(pos, rotAxis, rotSign) {
	// whitch directions are rotated to the positive x/y/z axis
	var xPreimage = rotateDirection({axis:AXIS_X, sign:1}, rotAxis, -rotSign);
	var yPreimage = rotateDirection({axis:AXIS_Y, sign:1}, rotAxis, -rotSign);
	var zPreimage = rotateDirection({axis:AXIS_Z, sign:1}, rotAxis, -rotSign);
	return {x:pos[axisToString(xPreimage.axis)]*xPreimage.sign,
		y:pos[axisToString(yPreimage.axis)]*yPreimage.sign,
		z:pos[axisToString(zPreimage.axis)]*zPreimage.sign};
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
Piece.prototype.clone = function() {
	var result = new Piece();
	for (var dir of DIRECTIONS) {
		result.setFaceColor(dir, this.getFaceColor(dir));
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
// list of all piece positions in a cube
var ALLPOSITIONS = [];
for (var x=-1; x<=1; x++) {
	for (var y=-1; y<=1; y++) {
		for (var z=-1; z<=1; z++) {
			ALLPOSITIONS.push({x:x, y:y, z:z});
		}
	}
}
// getter and setter for the pieces
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
			this.getPiece(pos).setFaceColor(dir, i);
		}
	}
}
// rotate the whole cube
Cube.prototype.rotate = function(rotAxis, rotSign) {
	var result = new Cube();
	for (var pos of ALLPOSITIONS) {
		result.setPiece(rotatePosition(pos, rotAxis, rotSign),
			this.getPiece(pos).rotate(rotAxis, rotSign));
	}
	return result;
}
// rotate a plane
Cube.prototype.rotatePlane = function(axis, index, rotSign) {
	var result = new Cube();
	for (var pos of ALLPOSITIONS) {
		if (pos[axisToString(axis)]==index) {
			result.setPiece(pos, this.getPiece(
				rotatePosition(pos, axis, -rotSign)
				).rotate(axis, rotSign));
		}
		else {
			result.setPiece(pos, this.getPiece(pos).clone());
		}
	}
	return result;	
}
// render the whole cube
Cube.prototype.render = function(mvMatrix) {
	for (var pos of ALLPOSITIONS) {
		this.renderPieceAt(mvMatrix, pos);
	}
}
// render one plane (9x9 pieces)
Cube.prototype.renderPlane = function(mvMatrix, axis, index) {
	for (var pos of this.plane(axis, index)) {
		this.renderPieceAt(mvMatrix, pos);
	}
}
// render a piece at its correct position relative to the center of the cube
Cube.prototype.renderPieceAt = function(mvMatrix, pos) {
	var pieceInterval = pieceSize*1.02;
	renderPiece(matTranslate(mvMatrix,
		pos.x*pieceInterval,
		pos.y*pieceInterval,
		pos.z*pieceInterval),
	this.getPiece(pos));
}
