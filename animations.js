

var animationRunning = null; // null, when no animation is active,
	// otherwise holding the value to pass from setInterval()
	// to clearInterval()

var perspectiveAnimation = null;
var cubeRotationAnimation = null;
var planeRotationAnimation = null;



// draw one animation frame
// and break the loop if all animations are done
function animationTick() {
	// delete finished animations
	if (cubeRotationAnimation && cubeRotationAnimation.done()) {
		cubeRotationAnimation = null;
	}
	if (perspectiveAnimation && perspectiveAnimation.done()) {
		perspectiveAnimation = null;
	}
	if (planeRotationAnimation && planeRotationAnimation.done()) {
		planeRotationAnimation = null;
	}
	// break loop, if no animation is running any more
	if (!cubeRotationAnimation && !perspectiveAnimation && !planeRotationAnimation) {
		clearInterval(animationRunning);
		animationRunning = null;
	}
	// render the frame
	render();
}

// start the animation frame loop if not running yet
function assureAnimationRunning() {
	if (animationRunning) return;
	animationRunning = setInterval(animationTick, 30);
}




// the general animation class
// ---------------------------
function Animation(duration) {
	this.startTime = (new Date()).getTime();
	this.duration = duration;
}
// is this animation finished
Animation.prototype.done = function() {
	return (new Date()).getTime() > this.startTime+this.duration;
}
Animation.prototype.progress = function() {
	var progress = ((new Date()).getTime()-this.startTime)/this.duration;
	if (progress < 1) return progress;
	else return 1;
}
// apply some continuous distortion function to the linear progress
// to make animations look smoother
// also, start at 1 and finish at 0
Animation.prototype.getValue = function() {
	function distortion(x) {
		return (1+Math.cos(Math.PI*x))/2;
	}
	return distortion(this.progress());
}


