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

	var cube1 = new Physijs.BoxMesh( new THREE.CubeGeometry(1,1,1), new THREE.MeshBasicMaterial({color: 0xFFFF00}), 1);
	mainScene.add(cube1);

	hudScene = new THREE.Scene();

	var cube2 = new THREE.Mesh( new THREE.CubeGeometry(1,1,1), new THREE.MeshBasicMaterial({color: 0xFFFF00}), 1);
	hudScene.add(cube2);

	hudScene.add()

}

function initAudio(){

}

function initMain(){

	mainRenderer = new THREE.WebGLRenderer();
	mainRenderer.setClearColor( 0x000033, 1.0 );
	
	mainRenderer.shadowMap.enabled = true;

	mainCamera = new THREE.PerspectiveCamera( 45, 1, 0.1, 10000 );
	mainCamera.position.set(2,2,2);
	mainCamera.lookAt( mainScene.position );

	$("#mainView").append( mainRenderer.domElement );

}

function initHUD(width, height){

	hudRenderer = new THREE.WebGLRenderer({ alpha: true });
	
	hudRenderer.shadowMap.enabled = true;

	hudCamera = new THREE.PerspectiveCamera( 45, 1, 0.1, 10000 );
	hudCamera.position.set(2,2,2);

	hudCamera.lookAt(hudScene.position);

	$("#hudView").append( hudRenderer.domElement );

}

function getDivRefs(){

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
    	hudRenderer.setSize(side, side, true);
    	hudRenderer.setScissor(0, 0, side, side);
    }else{
    	side = Math.round(w*0.30);
    	hudRenderer.setSize(side, side, true);
    	hudRenderer.setScissor(0, 0, side, side);
    }

    
}

window.addEventListener('keyup', function switchMute(event) { if( event == 77 ) muted = !muted }, false);

function render(){

	if(!paused){

		mainScene.simulate();

	}

	resizeMain();
	mainRenderer.render( mainScene, mainCamera );

	resizeHUD();
	hudRenderer.render( hudScene, hudCamera );

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