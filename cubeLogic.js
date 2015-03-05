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
Piece.prototype.setFaceColor = function(direction, index) {
	this.faceColors[direction.axis][direction.sign] = index;
}
Piece.prototype.rotate = function(rotAxis, rotSign) {
	var result = new Piece();
	for (var dir of DIRECTIONS) {
		var otherFace =	rotateDirection(
				faceAcis, faceSign,
				rotAxis, rotSign);
		result.setFaceColor(rotateDirection(dir, rotAxis, rotSign),
			this.getFaceColor(dir));
	}
}


