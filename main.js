"use strict";

// note: mat4.* (and vec3.*) are calls to the glMatrix library

// global variables:
var canvas;
var gl = null; // the webgl context
var shaderLocations = {}; // will hold junctures to the shaders
shaderLocations.aVertexPosition = null; // vertex position attribute
shaderLocations.aVertexColor = null; // vertex color attribute
shaderLocations.uPMatrix = null; // projection matrix uniform
shaderLocations.uMVMatrix = null; // model view matrix uniform
var pMatrix; // the projection matrix
var perspective = {}; // direction of slant
perspective.x = 1; // initially look at the top
perspective.y = -1; // and right of the cube
var SLANT = Math.PI*0.1; // extent of slant in rad

// the virtual cube
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


	// listen for keyboard input
	addEventListener("keydown", function(event) {onKeyDown(event);});


	// setup the virtual cube
	theCube = new Cube();
	theCube.reset();
	for (var i=0; i<21*60; i++)
		theCube = theCube.rotatePlane(AXIS_X, 1, -1).rotate(AXIS_Y, -1);


	render();
}



// render the cube, applying all animation rotations
function render() {
	if (!gl) return;
	// clear background
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	// setup modelview matrix
	var mvMatrix = mat4.create(); // identity matrix
	mat4.identity(mvMatrix);
	mat4.translate(mvMatrix, mvMatrix, vec3.fromValues(0, 0, -10));
	//apply perspective slant and possibly apply perspective animation
	var pAnim = perspectiveAnimation;
	mat4.rotateX(mvMatrix, mvMatrix, perspective.x*SLANT);
	if (pAnim && pAnim.axis==AXIS_X) {
		mat4.rotateX(mvMatrix, mvMatrix,
				-pAnim.rotSign*pAnim.getValue()*2*SLANT);
	}
	mat4.rotateY(mvMatrix, mvMatrix, perspective.y*SLANT);
	if (pAnim && pAnim.axis==AXIS_Y) {
		mat4.rotateY(mvMatrix, mvMatrix,
				-pAnim.rotSign*pAnim.getValue()*2*SLANT);
	}

	// possibly apply cube rotation animation
	var crAnim = cubeRotationAnimation;
	if (crAnim) {
		var matrixRotation = axisToMatrixRotation(crAnim.axis);
		mvMatrix = matrixRotation(mvMatrix,
				- Math.PI/2 * crAnim.rotSign
				* crAnim.getValue());
	}

	// render the cube, apply plane rotation animation if needed
	var prAnim = planeRotationAnimation;
	if (prAnim) {
		// render unrotated planes
		for (var planeIndex of [-1, 0, 1]) {
			if (planeIndex!=prAnim.index) {
				theCube.renderPlane(mvMatrix, prAnim.axis, planeIndex);
			}
		}
		// render rotated plane
		var matrixRotation = axisToMatrixRotation(prAnim.axis);
		theCube.renderPlane(
			matrixRotation(mvMatrix, -prAnim.rotSign*Math.PI/2*prAnim.getValue()),
			prAnim.axis, prAnim.index);
	}
	else {
		theCube.render(mvMatrix);
	}
}



// user input handling
// -------------------
var keybindings =
	{37/*left arrow*/:{func:onRotateCube, arg:"left"}
	,38/*up arrow*/:{func:onRotateCube, arg:"up"}
	,39/*right arrow*/:{func:onRotateCube, arg:"right"}
	,40/*down arrow*/:{func:onRotateCube, arg:"down"}
	,81/*Q*/:{func:onRotatePlane, arg:"left plane up"}
	,87/*W*/:{func:onRotatePlane, arg:"top plane left"}
	,69/*E*/:{func:onRotatePlane, arg:"top plane right"}
	,82/*R*/:{func:onRotatePlane, arg:"right plane up"}
	,83/*S*/:{func:onRotatePlane, arg:"front plane counter-clockwise"}
	,68/*D*/:{func:onRotatePlane, arg:"front plane clockwise"}
	,89/*Y*/:{func:onRotatePlane, arg:"left plane down"}
	,90/*Z*/:{func:onRotatePlane, arg:"left plane down"}
	,88/*X*/:{func:onRotatePlane, arg:"bottom plane left"}
	,67/*c*/:{func:onRotatePlane, arg:"bottom plane right"}
	,86/*V*/:{func:onRotatePlane, arg:"right plane down"}
	}
function onKeyDown(event) {
	var action = keybindings[event.keyCode];
	if (action) {
		event.preventDefault();
		action.func(action.arg);
	}
}
function onRotateCube(strDir) {
	var axis, sign;
	switch (strDir) {
		case "left":
			axis = AXIS_Y;
			sign = -1;
			break;
		case "right":
			axis = AXIS_Y;
			sign = 1;
			break;
		case "up":
			axis = AXIS_X;
			sign = -1;
			break;
		case "down":
			axis = AXIS_X;
			sign = 1;
			break;
		default:
			alert("unknown cube rotation string: "+strDir);
			return;
	}
	if (perspective[axisToString(axis)] != sign) {
		flipPerspective(axis);
	}
	else {
		flipPerspective(axis);
		rotateCube(axis, sign);
	}
}
// just rotate the perspective animatedly
function flipPerspective(axis) {
	var a = axisToString(axis);
	// actually flip perspective variable
	perspective[a] = -perspective[a];
	// prepare animation
	var anim = new Animation(300);
	anim.axis = axis;
	anim.rotSign = perspective[a];
	// set and start animation if necessary
	perspectiveAnimation = anim;
	assureAnimationRunning();
}
// rotate the Cube by 90 degrees animatedly
function rotateCube(axis, sign) {
	// actually rotate the virtual cube
	theCube=theCube.rotate(axis, sign);
	// prepare the animation
	var anim = new Animation(300);
	anim.axis = axis;
	anim.rotSign = sign;
	// set and start animation if necessary
	cubeRotationAnimation = anim;
	assureAnimationRunning();
}
function onRotatePlane(strAction) {
	var axis, index, rotSign;
	switch (strAction) {
		case "left plane up":
			axis = AXIS_X;
			index = -1; rotSign = -1;
			break;
		case "left plane down":
			axis = AXIS_X;
			index = -1; rotSign = 1;
			break;
		case "right plane up":
			axis = AXIS_X;
			index = 1; rotSign = -1;
			break;
		case "right plane down":
			axis = AXIS_X;
			index = 1; rotSign = 1;
			break;
		case "top plane left":
			axis = AXIS_Y;
			index = 1; rotSign = -1;
			break;
		case "top plane right":
			axis = AXIS_Y;
			index = 1; rotSign = 1;
			break;
		case "bottom plane left":
			axis = AXIS_Y;
			index = -1; rotSign = -1;
			break;
		case "bottom plane right":
			axis = AXIS_Y;
			index = -1; rotSign = 1;
			break;
		case "front plane clockwise":
			axis = AXIS_Z;
			index = 1; rotSign = -1;
			break;
		case "front plane counter-clockwise":
			axis = AXIS_Z;
			index = 1; rotSign = 1;
			break;
	}
	rotateCubePlane(axis, index, rotSign);
}
function rotateCubePlane(axis, index, rotSign) {
	// actually rotate the plane
	theCube=theCube.rotatePlane(axis, index, rotSign);
	// prepare the animation
	var anim = new Animation(300);
	anim.axis = axis;
	anim.index = index;
	anim.rotSign = rotSign;
	// set and start animation if necessary
	planeRotationAnimation = anim;
	assureAnimationRunning();
}

// helper function for the render() function,
// turns a symbolic axis index into the corresponding
// matrix rotation function
function axisToMatrixRotation(axis) {
	switch (axis) {
		case AXIS_X:
			return matRotateX;
		case AXIS_Y:
			return matRotateY;
		case AXIS_Z:
			return matRotateZ;
	}
}
