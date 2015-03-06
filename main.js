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




var theCube;



function onLoad() {
	// find canvas to render in
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
	

	gl.enable(gl.DEPTH_TEST);
	
	initVertexBuffers();

	// setup projection matrix
	pMatrix = mat4.create();
	// 45 degrees vertical field of view, aspect ratio 1
	mat4.perspective(pMatrix, Math.PI/4, 1, 0.01, 1000);
	gl.uniformMatrix4fv(shaderLocations.uPMatrix, false, pMatrix);


	// setup the virtual cube
	theCube = new Cube();
	theCube.reset();

	render();
}



function render() {
	if (!gl) return;
	// clear background
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// setup modelview matrix
	var mvMatrix = mat4.create(); // identity matrix
	mat4.identity(mvMatrix);
	mat4.translate(mvMatrix, mvMatrix, vec3.fromValues(0, 0, -10));
	mat4.rotateX(mvMatrix, mvMatrix, Math.PI/2*0.2);
	mat4.rotateY(mvMatrix, mvMatrix, -Math.PI/2*0.2);

	theCube.render(mvMatrix);
	theCube.render(mvMatrix);
}


// user input handling
function onRotateCube(strDir) {
	var axis, sign;
	switch (strDir) {
		case "left":
			theCube = theCube.rotate(AXIS_Y, -1);
			break;
		case "right":
			theCube = theCube.rotate(AXIS_Y, 1);
			break;
		case "up":
			theCube = theCube.rotate(AXIS_X, -1);
			break;
		case "down":
			theCube = theCube.rotate(AXIS_X, 1);
			break;
		default:
			alert("unknown cube rotation string: "+strDir);
			return;
	}
	render();
}
function onRotatePlane(strAction) {
	switch (strAction) {
		case "left plane up":
			theCube = theCube.rotatePlane(AXIS_X, -1, -1);
			break;
		case "left plane down":
			theCube = theCube.rotatePlane(AXIS_X, -1, 1);
			break;
		case "right plane up":
			theCube = theCube.rotatePlane(AXIS_X, 1, -1);
			break;
		case "right plane down":
			theCube = theCube.rotatePlane(AXIS_X, 1, 1);
			break;
		case "top plane left":
			theCube = theCube.rotatePlane(AXIS_Y, 1, -1);
			break;
		case "top plane right":
			theCube = theCube.rotatePlane(AXIS_Y, 1, 1);
			break;
		case "bottom plane left":
			theCube = theCube.rotatePlane(AXIS_Y, -1, -1);
			break;
		case "bottom plane right":
			theCube = theCube.rotatePlane(AXIS_Y, -1, 1);
			break;
		case "front plane clockwise":
			theCube = theCube.rotatePlane(AXIS_Z, 1, -1);
			break;
		case "front plane counter-clockwise":
			theCube = theCube.rotatePlane(AXIS_Z, 1, 1);
			break;
	}
	render();
}
