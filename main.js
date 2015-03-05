"use strict";

// note: mat4.* (and vec3.*) are calls to the glMatrix library

// global variables:
var canvas;
var gl = null; // the webgl context
var vertexBuffers = new Object(); // will hold gl-buffers for vertices
				// of one primitive
var shaderLocations = new Object(); // will hold junctures to the shaders
shaderLocations.aVertexPosition = null; // vertex position attribute
shaderLocations.aVertexColor = null; // vertex color attribute
shaderLocations.uPMatrix = null; // projection matrix uniform
shaderLocations.uMVMatrix = null; // model view matrix uniform
var pMatrix; // the projection matrix
var pieceSize = 1.0; // can be used to scale the whole cube

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

// colors to appear at piece faces
var GAMECOLORS =
	[{name:"red"   , red:0.90, green:0.00, blue:0.30}
	,{name:"green" , red:0.10, green:0.80, blue:0.20}
	,{name:"blue"  , red:0.00, green:0.20, blue:0.90}
	,{name:"white" , red:0.90, green:0.90, blue:0.90}
	,{name:"yellow", red:0.90, green:0.85, blue:0.20}
	,{name:"orange", red:0.99, green:0.60, blue:0.00}
	];
// color to apper at piece faces, where no game color is set
var UNDEFINEDGAMECOLOR = [0.4, 0.4, 0.4, 1.0];


// the cube piece class
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


var thePiece = new Piece();
for (var i=0; i<6; i++) {
	thePiece.setFaceColor(DIRECTIONS[i], i);
}



function onLoad() {
	var div = document.getElementById("randomdiv");
	div.innerHTML = "some output:";
	for (var dir of DIRECTIONS) {
		div.innerHTML += " " + thePiece.getFaceColor(dir);
	}

	canvas = document.getElementById("webgl canvas");

	// try to initialize webgl
	try {gl = canvas.getContext("webgl");} catch (e) {}
	if (!gl) try {gl = canvas.getContext("experimental-webgl");}
		catch (e) {}
	if (!gl) {
		alert("Sorry, WebGL couldn't be initialized.");
		return;
	}

	// initialize shaders
	var vertexShader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vertexShader,
			document.getElementById("vertex shader").innerHTML);
	gl.compileShader(vertexShader);
	var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(fragmentShader,
			document.getElementById("fragment shader").innerHTML);
	gl.compileShader(fragmentShader);
	var shaderProgram = gl.createProgram();
	gl.attachShader(shaderProgram, vertexShader);
	gl.attachShader(shaderProgram, fragmentShader);
	gl.linkProgram(shaderProgram);
	if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
		alert("Sorry, shaders couldn't be compiled/linked.");
		return null;
	}
	gl.useProgram(shaderProgram);

	// get junctures to shaders
	shaderLocations.aVertexPosition =
		gl.getAttribLocation(shaderProgram, "aVertexPosition");
	gl.enableVertexAttribArray(shaderLocations.aVertexPosition);
	shaderLocations.aVertexColor =
		gl.getAttribLocation(shaderProgram, "aVertexColor");
	shaderLocations.uPMatrix =
		gl.getUniformLocation(shaderProgram, "uPMatrix");
	shaderLocations.uMVMatrix =
		gl.getUniformLocation(shaderProgram, "uMVMatrix");
	
	// enable depth testing
	gl.enable(gl.DEPTH_TEST);
	
	// initialize objects to be rendered
	initVertexBuffers();

	// setup projection matrix
	pMatrix = mat4.create();
	// 45 degrees vertical field of view, aspect ratio 1
	mat4.perspective(pMatrix, Math.PI/4, 1, 0.01, 1000);
	gl.uniformMatrix4fv(shaderLocations.uPMatrix, false, pMatrix);


	render();
}

function initVertexBuffers() {
	if (!gl) return;
	// useful units for a cube piece
	var o = pieceSize/2;
	var i = o*0.8;
	// piece edge
	vertexBuffers.pieceEdge = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffers.pieceEdge);
	var pieceEdgeVertices =
		[i, o, -i
		,o, i, -i
		,i, o, i
		,o, i, i
		];
	gl.bufferData(gl.ARRAY_BUFFER,
			new Float32Array(pieceEdgeVertices),
			gl.STATIC_DRAW);
	// piece corner
	vertexBuffers.pieceCorner = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffers.pieceCorner);
	var pieceCornerVertices =
		[i, o, i
		,i, i, o
		,o, i, i
		];
	gl.bufferData(gl.ARRAY_BUFFER,
			new Float32Array(pieceCornerVertices),
			gl.STATIC_DRAW);
	// piece face
	vertexBuffers.pieceFace = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffers.pieceFace);
	var pieceFaceVertices =
		[i, i, o
		,-i, i, o
		,i, -i, o
		,-i, -i, o
		];
	gl.bufferData(gl.ARRAY_BUFFER,
			new Float32Array(pieceFaceVertices),
			gl.STATIC_DRAW);
}

function render() {
	if (!gl) return;
	// clear background
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// setup modelview matrix
	var mvMatrix = mat4.create(); // identity matrix
	mat4.identity(mvMatrix);
	mat4.translate(mvMatrix, mvMatrix, vec3.fromValues(0, 0, -5));
	mat4.rotateX(mvMatrix, mvMatrix, Math.PI/2*0.2);
	mat4.rotateY(mvMatrix, mvMatrix, Math.PI/2*0.2);

	renderPiece(mvMatrix, thePiece);
}

// set current rendering color by RGB components
function setColor(r, g, b) {
	gl.vertexAttrib4fv(shaderLocations.aVertexColor,
		[r, g, b, 1.0]);
}
// set current rendering color by an index to the GAMECOLOR table
function setColorByIndex(i) {
	if (GAMECOLORS[i]) {
		gl.vertexAttrib4fv(shaderLocations.aVertexColor,
			[GAMECOLORS[i].red
			,GAMECOLORS[i].green
			,GAMECOLORS[i].blue
			,1.0]);
	}
	else {
		gl.vertexAttrib4fv(shaderLocations.aVertexColor,
			UNDEFINEDGAMECOLOR);
	}
}

// render a cube piece (with given face colors)
function renderPiece(mvMatrix, piece) {
	renderPieceFrame(mvMatrix);
	for (var dir of DIRECTIONS) {
		setColorByIndex(piece.getFaceColor(dir));
		renderPieceFace(mvMatrix, dir);
	}
}
// rendering various parts of a cube piece
function renderPieceFace(mvMatrix, direction) {
	var newMVMatrix;
	switch (direction.axis) {
		case AXIS_X:
			newMVMatrix = matRotateY(mvMatrix, Math.PI/2);
			break;
		case AXIS_Y:
			newMVMatrix = matRotateX(mvMatrix, -Math.PI/2);
			break;
		case AXIS_Z:
			newMVMatrix = mat4.clone(mvMatrix);
			break;
		default:
			throw new Error("not an axis index: "+direction.axis);
	}
	var test = false;
	if (direction.sign==-1) {
		mat4.scale(newMVMatrix, newMVMatrix, vec3.fromValues(-1, -1, -1));
		test = true;
	}
	//alert("render face (axes:"+direction.axis+",sign:"+direction.sign+"), flipped:"+test);
	renderFrontPieceFace(newMVMatrix);
	//alert("(rendered.)");
}
function renderFrontPieceFace(mvMatrix) {
	// pass modelview matrix
	gl.uniformMatrix4fv(shaderLocations.uMVMatrix, false, mvMatrix);
	// render verticies from vertexBuffer
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffers.pieceFace);
	gl.vertexAttribPointer(shaderLocations.aVertexPosition,
		3, gl.FLOAT, false, 0, 0);
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}
function renderPieceFrame(mvMatrix) {
	setColor(0.60, 0.60, 0.60);
	renderPieceEdges(mvMatrix);
	setColor(0.70, 0.70, 0.70);
	renderPieceCorners(mvMatrix);
}
function renderPieceEdges(mvMatrix) {
	for (var newMVMatrix of
		[mvMatrix
		,matRotateX(mvMatrix, Math.PI*0.5)
		,matRotateY(mvMatrix, Math.PI*0.5)
		]) {
		renderFourPieceEdges(newMVMatrix);
	}
}
function renderFourPieceEdges(mvMatrix) {
	for (var i=0; i<4; i++) {
		renderOnePieceEdge(matRotateZ(mvMatrix, Math.PI*0.5*i));
	}
}
function renderOnePieceEdge(mvMatrix) {
	// pass modelview matrix
	gl.uniformMatrix4fv(shaderLocations.uMVMatrix, false, mvMatrix);
	// render verticies from vertexBuffer
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffers.pieceEdge);
	gl.vertexAttribPointer(shaderLocations.aVertexPosition,
		3, gl.FLOAT, false, 0, 0);
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}
function renderPieceCorners(mvMatrix) {
	for (var xscale of [-1, 1])
		for (var yscale of [-1, 1])
			for (var zscale of [-1, 1])
				renderOnePieceCorner(matScaleXYZ(mvMatrix,
					xscale, yscale, zscale));
}
function renderOnePieceCorner(mvMatrix) {
	// pass modelview matrix
	gl.uniformMatrix4fv(shaderLocations.uMVMatrix, false, mvMatrix);
	// render vertices from vertex buffer
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffers.pieceCorner);
	gl.vertexAttribPointer(shaderLocations.aVertexPosition,
		3, gl.FLOAT, false, 0, 0);
	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 3);
}

// matrix helper functions
function matTranslate(matrix, x, y, z) {
	var result = mat4.create();
	mat4.translate(result, matrix, vec3.fromValues(x, y, z));
	return result;
}
function matRotateX(matrix, rad) {
	var result = mat4.create();
	mat4.rotateX(result, matrix, rad);
	return result;
}
function matRotateY(matrix, rad) {
	var result = mat4.create();
	mat4.rotateY(result, matrix, rad);
	return result;
}
function matRotateZ(matrix, rad) {
	var result = mat4.create();
	mat4.rotateZ(result, matrix, rad);
	return result;
}
function matScaleXYZ(matrix, xscale, yscale, zscale) {
	var result = mat4.create();
	mat4.scale(result, matrix,
		vec3.fromValues(xscale, yscale, zscale));
	return result;
}
