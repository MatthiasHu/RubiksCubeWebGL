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


function onLoad() {
	var div = document.getElementById("randomdiv");
	div.innerHTML = "sooooo much randomness";
	for (var str of ["abc", "def", "hust"]) {
		div.innerHTML += " "+str;
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
	// piece edge
	vertexBuffers.pieceEdge = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffers.pieceEdge);
	var o = pieceSize/2;
	var i = o*0.8;
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
	mat4.rotateY(mvMatrix, mvMatrix, 0.20);

	renderPieceFrame(mvMatrix);
}

function setColor(r, g, b) {
	gl.vertexAttrib4fv(shaderLocations.aVertexColor,
		[r, g, b, 1.0]);
}

// rendering various parts of a piece
function renderPieceFrame(mvMatrix) {
	setColor(0.5, 0.5, 0.5);
	renderPieceEdges(mvMatrix);
	setColor(0.4, 0.4, 0.4);
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
