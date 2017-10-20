'use strict';

Physijs.scripts.worker = 'Libs/physijs_worker.js';
Physijs.scripts.ammo = 'ammo.js';

window.onload = init;

var mainScene, hudScene;

var mouse = new THREE.Vector2();
var mouseDown = false;
var raycaster = new THREE.Raycaster();

var mainCamera, mainRenderer;

var hudCamera, hudRenderer;

var clock = new THREE.Clock();

var muted = false, paused = false;

var rotation = [ 0, 0 ];
var rotSpeed = 4;

var objectInHud, objectinMain;

var cube1, cube2;

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

	cube1 = new Physijs.BoxMesh( new THREE.CubeGeometry(1,1,1), new THREE.MeshBasicMaterial({color: 0xFFFF00}), 1);
	cube1.position.set(-1,0,-1);
	mainScene.add(cube1);

	cube2 = new Physijs.BoxMesh( new THREE.CubeGeometry(1,1,1), new THREE.MeshBasicMaterial({color: 0xFF0000}), 1);
	cube2.position.set(1,0,-1);
	mainScene.add(cube2);

	hudScene = new THREE.Scene();

}

function viewObjectInHud( object ){

	hudScene.remove(objectInHud);

	if( object != null ){
		objectinMain = object;
		objectInHud = object.clone();
		objectInHud.position.set(0,0,0);
		hudScene.add( objectInHud );
	}

}

function initAudio(){

}

function initMain(){

	mainRenderer = new THREE.WebGLRenderer();
	mainRenderer.setClearColor( 0x000033, 1.0 );
	
	mainRenderer.shadowMap.enabled = true;

	mainCamera = new THREE.PerspectiveCamera( 45, 1, 0.1, 10000 );
	mainCamera.position.set(0,2,2);
	mainCamera.lookAt( mainScene.position );

	$("#mainView").append( mainRenderer.domElement );

}

function initHUD(width, height){

	hudRenderer = new THREE.WebGLRenderer({ alpha: true });
	
	hudRenderer.shadowMap.enabled = true;

	hudCamera = new THREE.PerspectiveCamera( 45, 1, 0.1, 10000 );
	hudCamera.position.set(0,2,2);

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

Mousetrap.bind('m', function(){ muted = !muted; }, false);

function render(){

	if(!paused){

		//mainScene.simulate();
		handleMouse();

	}

	resizeMain();
	mainRenderer.render( mainScene, mainCamera );

	resizeHUD();
	hudRenderer.render( hudScene, hudCamera );

	requestAnimationFrame( render );

}

function handleMouse(){

	if(!mouseDown){

		raycaster.setFromCamera( mouse, mainCamera );
		var intersects = raycaster.intersectObjects( mainScene.children );

		if( intersects.length > 0)
			viewObjectInHud( intersects[0].object );
		else
			viewObjectInHud( null );

	}

	if( objectInHud != null )
			objectInHud.rotation.copy( objectinMain.rotation );

}

window.addEventListener("mousedown", function(e){ mouseDown = true; } , false);
window.addEventListener("mouseup", function(e){ mouseDown = false; } , false);

window.addEventListener("mousemove", function(e){ handleMouseMovement(e); } , false);

function handleMouseMovement(e){

	const newX = ( event.clientX / window.innerWidth ) * 2 - 1;
	const newY = -( event.clientY / window.innerHeight ) * 2 + 1;

	if(mouseDown && objectinMain != null){

		var invQuat = objectinMain.quaternion.inverse();
		var verticalAxis = new THREE.Vector3(0,1,0).applyQuaternion( invQuat );
		var horizontalAxis = new THREE.Vector3(1,0,0).applyQuaternion( invQuat );

		//objectinMain.rotateY( (newX-mouse.x) );
		//objectinMain.rotateX( -(newY-mouse.y) );

		objectinMain.rotateOnAxis( verticalAxis, (newX-mouse.x)*10 );
		objectinMain.rotateOnAxis( horizontalAxis, -(newY-mouse.y)*10 );

	}

	mouse.x = newX;
	mouse.y = newY;
	
}