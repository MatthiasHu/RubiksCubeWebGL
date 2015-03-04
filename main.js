"use strict";

// global variables:
var canvas;
var gl = null; // the webgl context
var vertexBuffer; // gl-buffer for vertices of one primitive
var vertPosAttributeLocation; // used to identify the vertex position attribut
	// in the vertex shader and to bind vertex array data to this attribute


function onLoad() {
	var div = document.getElementById("randomdiv");
	div.innerHTML = "sooooo much randomness";

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
	vertPosAttributeLocation = gl.getAttribLocation(shaderProgram,
		"aVertexPosition");
	gl.enableVertexAttribArray(vertPosAttributeLocation);
	
	alert("ok");
	initVertexBuffers();
	render();

}

function initVertexBuffers() {
	if (!gl) return;
	vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	var vertices =
		[1.0, 1.0, 0.0
		,0.5, -0.5, 0.0
		,-0.5, 0.5, 0.0
		];
	gl.bufferData(gl.ARRAY_BUFFER,
			new Float32Array(vertices),
			gl.STATIC_DRAW);
}

function render() {
	if (!gl) return;
	gl.clearColor(0.0, 0.0, 0.0, 1.0);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	gl.vertexAttribPointer(vertPosAttributeLocation, 3, gl.FLOAT, false, 0, 0);
	gl.drawArrays(gl.TRIANGLES, 0, 3);

	alert("rendered.");
}
