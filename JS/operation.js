'use strict';

Physijs.scripts.worker = 'Libs/physijs_worker.js';
Physijs.scripts.ammo = 'ammo.js';

document.exitPointerLock = document.exitPointerLock || document.mozExitPointerLock;

window.onload = init;

var mainScene, hudScene;

var hud;

var mainCamera, mainRenderer;

var hudCamera, hudRenderer;

var clock = new THREE.Clock();

var muted = false, paused = false;

function hole(){

	this.holeViewPosition;
	this.holeMesh;

}

function init(){

	initScene();

	initAudio();

	initMain();
	initHUD();

	render();

}

function initScene(){

	mainScene = new Physijs.Scene();
	mainScene.setGravity( new THREE.Vector3(0,0,0) );

}

function initAudio(){

}

function initMain(){

	mainRenderer = new THREE.WebGLRenderer();
	mainRenderer.setClearColor( 0x000033, 1.0 );
	
	mainRenderer.shadowMap.enabled = true;

	mainCamera = new THREE.PerspectiveCamera( 45, 1, 0.1, 10000 );
	mainCamera.layers.enable(2);

	player.add(mainCamera);
	mainCamera.lookAt( new THREE.Vector3(0,0,10) );

	document.getElementById("mainView").appendChild( mainRenderer.domElement );

}

function initHUD(width, height){

	hudRenderer = new THREE.WebGLRenderer({ alpha: true });
	
	hudRenderer.shadowMap.enabled = true;

	hudCamera = new THREE.OrthographicCamera( height / -2, height / 2, width / 2, width / -2);
	hudCamera.position.y = 1000;
	hudCamera.layers.enable(1);

	hudCamera.lookAt(mainScene.position);

	document.getElementById("hudView").appendChild( hudRenderer.domElement );

}

function getDivRefs(){

}

function spawnStartScreen(){

	window.addEventListener("click", onClick);

	document.body.appendChild(myName);

	centerImage.src = 'Textures/Overlook.png'
	document.body.appendChild(centerImage);

	document.body.appendChild(instructions);

	button.style.fontSize = 2 + 'vw';
	button.style.backgroundColor = 'lightred';
	button.style.color = 'black';
	button.style.fontFamily = "sans-serif";
	button.innerHTML = "START";

	button.addEventListener("click", removeStartScreen);

	document.body.appendChild(button);
	
}
function removeStartScreen(){

		document.body.removeChild(centerImage);
		document.body.removeChild(button);
		document.body.removeChild(myName);
		document.body.removeChild(instructions);
		hud.style.visibility = 'visible';
		paused = false;
		window.addEventListener("click", onClick);

		button.removeEventListener("click", removeStartScreen);

		setTimeout( function(){
			document.addEventListener('pointerlockchange', mouseLocked, false);
			document.addEventListener('mozpointerlockchange', mouseLocked, false);
			window.removeEventListener("click", onClick);
		}, 500);

	var loader = new THREE.FontLoader();
	loader.load('Fonts/helvetiker_regular.typeface.json', function(font){

		var textGeometry = new THREE.TextGeometry( "FIND THE REDRUMS\n DON'T GET KILLED", {
			font: font,
			size: 0.8,
			height: 0.3,
			curveSegments: 1
		});

		textGeometry.computeBoundingBox();
		var offset = -0.5 * ( textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x );

		var text = new THREE.Mesh( textGeometry, new THREE.MeshBasicMaterial({color: 0x550000}) );
		text.position.x = -offset;
		text.position.z = 2;
		text.rotation.y = Math.PI;
		mainScene.add( text );

	});

}

function spawnPauseDivs(){
	overlay.style.backgroundColor = 'white';
	overlay.style.opacity = 0.3;
	overlay.style.filter = "alpha(opacity=30)";
	document.body.appendChild(overlay);

	centerText.style.fontSize = 6 + 'vw';
	centerText.style.color = 'red';
	centerText.style.fontFamily = "sans-serif";
	centerText.innerHTML = "PAUSED";
	document.body.appendChild(centerText);

	button.style.fontSize = 2 + 'vw';
	button.style.backgroundColor = 'lightred';
	button.style.color = 'red';
	button.style.fontFamily = "sans-serif";
	button.innerHTML = "PLAY";
	document.body.appendChild(button);

	instructions.style.color = 'red';
	document.body.appendChild(instructions);

	myName.style.color = 'red';
	document.body.appendChild(myName);

	window.addEventListener("click", onClick);
	
}

function spawnDeathDivs(){

	if( !killed ){
		killed = true

		document.removeEventListener('pointerlockchange', mouseLocked, false);
		document.removeEventListener('mozpointerlockchange', mouseLocked, false);
		document.exitPointerLock();
		paused = true;

		window.removeEventListener("click", onClick);

		overlay.style.backgroundColor = 'red';
		overlay.style.opacity = 0.3;
		overlay.style.filter = "alpha(opacity=30)";
		document.body.appendChild(overlay);

		centerText.style.fontSize = 6 + 'vw';
		centerText.style.color = 'red';
		centerText.style.fontFamily = "sans-serif";
		centerText.innerHTML = "YOU DIED";
		document.body.appendChild(centerText);

		button.style.fontSize = 2 + 'vw';
		button.style.backgroundColor = 'lightred';
		button.style.color = 'red';
		button.style.fontFamily = "sans-serif";
		button.innerHTML = "PLAY AGAIN?";

		button.addEventListener ("click", function() {
		  location.reload();
		});

		document.body.appendChild(button);

	}
	
}

function spawnWinDivs(){

	if( !won ){
		won = true

		document.removeEventListener('pointerlockchange', mouseLocked, false);
		document.removeEventListener('mozpointerlockchange', mouseLocked, false);
		document.exitPointerLock();
		paused = true;

		window.removeEventListener("click", onClick);

		overlay.style.backgroundColor = 'white';
		overlay.style.opacity = 0.3;
		overlay.style.filter = "alpha(opacity=30)";
		document.body.appendChild(overlay);

		centerText.style.fontSize = 6 + 'vw';
		centerText.style.color = 'teal';
		centerText.style.fontFamily = "sans-serif";
		centerText.innerHTML = "YOU WON!";
		document.body.appendChild(centerText);

		button.style.fontSize = 2 + 'vw';
		button.style.backgroundColor = 'white';
		button.style.color = 'teal';
		button.style.fontFamily = "sans-serif";
		button.innerHTML = "PLAY AGAIN?";

		button.addEventListener ("click", function() {
		  location.reload();
		});

		document.body.appendChild(button);

	}
	
}

function resizeMain() {
	const w = document.body.clientWidth;
	const h = document.body.clientHeight;
    mainRenderer.setSize(w, h);
    mainCamera.aspect = w / h;
    mainCamera.updateProjectionMatrix();
};

function resizeHUD(){
	const w = document.body.clientWidth;
	const h = document.body.clientHeight;
	var side;

    if( w > h ){
    	side = Math.round(h*0.30);
    	hudRenderer.setSize( (side/height)*width ,side, true);
    	hudRenderer.setScissor(0,0,(side/height)*width,side)
    }else{
    	side = Math.round(w*0.30);
    	hudRenderer.setSize(side,(side/width)*height, true);
    	hudRenderer.setScissor(0,0,side,(side/width)*height)
    }

    
}

window.addEventListener('keyup', function switchMute(event) { if( event == 77 ) muted = !muted }, false);

function render(){

	if(!paused){

		mainScene.simulate();

	}

	resizeMain();
	mainRenderer.render( mainScene, mainCamera );

	hudRenderer.setScissorTest(true);
	resizeHUD();
	hudRenderer.render( mainScene, hudCamera );

	requestAnimationFrame( render );

}

function onClick(){

	mainRenderer.domElement.requestPointerLock = mainRenderer.domElement.requestPointerLock || mainRenderer.domElement.mozRequestPointerLock || mainRenderer.domElement.webkitRequestPointerLock;
	mainRenderer.domElement.requestPointerLock();

}

window.addEventListener("mousemove", function(e){ handleMouseMovement(e) } , false);

function handleMouseMovement(e){

	var requestedElement = mainRenderer.domElement;

	if (document.pointerLockElement === requestedElement || document.mozPointerLockElement === requestedElement || document.webkitPointerLockElement === requestedElement ){
		
		var movementX = e.movementX || e.mozMovementX || e.webkitMovementX || 0;

	}else{

	}
	
}

function mouseLocked(){

}