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

var left = false, right = false, up = false, down = false;

var objectInHud, objectinMain;

var board = null;

function hole(){

	this.holeViewPosition;
	this.holeMesh;

}

function init(){

	initScene();
	initLights();

	initAudio();

	initMain();
	initHUD();

	render();

}

function Board(quarterGeometry, quarterMaterials){

	this.quarters = new Array();

	this.size = 3.2;

	this.quarters[0] = new Quarter(quarterGeometry, quarterMaterials, 1, -1);
	this.quarters[1] = new Quarter(quarterGeometry, quarterMaterials, -1, -1);
	this.quarters[2] = new Quarter(quarterGeometry, quarterMaterials, -1, 1);
	this.quarters[3] = new Quarter(quarterGeometry, quarterMaterials, 1, 1);

}

function Quarter(geometry, materials, x, z){

	this.mesh = new THREE.Mesh(geometry, materials);

	this.size = 3.2;
	this.targetAngle = 0;
	this.spinSpeed = 0.05;
	this.x = x;
	this.z = z;

	this.mesh.position.set(this.x*this.size,0,this.z*this.size);

	this.spinLeft = function( ){
		this.targetAngle += Math.PI/2;
	}

	this.spinRight = function( ){
		this.targetAngle -= Math.PI/2;
	}

	this.spin = function(){

		if( this.targetAngle > this.mesh.rotation.y )
			this.mesh.rotation.y += Math.min(this.spinSpeed,this.targetAngle-this.mesh.rotation.y);
		else
			this.mesh.rotation.y += Math.max(-this.spinSpeed,this.targetAngle-this.mesh.rotation.y);

		this.setPositionFromAngle();

	}

	this.setPositionFromAngle = function(){

		const multiplier = 0.25 * Math.sin( 4 * this.mesh.rotation.y - Math.PI/2 ) + 1.25;

		this.mesh.position.set(this.x*this.size*multiplier,0,this.z*this.size*multiplier);

	}

}

function initScene(){

	mainScene = new THREE.Scene();

	var loader = new THREE.JSONLoader();
	loader.load('./Models/pentago.json', function(geometry, materials){
		var texture = new THREE.TextureLoader().load( "./Textures/plastic.png" );
		board = new Board(geometry, new THREE.MeshLambertMaterial({map: texture}) );
		mainScene.add(board.quarters[0].mesh);
		mainScene.add(board.quarters[1].mesh);
		mainScene.add(board.quarters[2].mesh);
		mainScene.add(board.quarters[3].mesh);
		board.quarters[3].spinLeft();
	})

	loader.load('./Models/arrow.json', function(geometry, materials){

		var arrow = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({color: 'white'}))
		arrow.position.set( 5, 1, 6.2 );
		arrow.rotation.y = Math.PI/2 + 0.2;
		mainScene.add(arrow);

		var arrow2 = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({color: 'white'}))
		arrow2.position.set( 6.2, 1, 5 );
		arrow2.rotation.y = Math.PI+0.2;
		arrow2.rotation.x = Math.PI;
		mainScene.add(arrow2);
	})

	hudScene = new THREE.Scene();

}

function initLights(){
    var spotLight = new THREE.SpotLight( 0xffffff );
	spotLight.position.set( -20, 20, 20 );

	spotLight.castShadow = true;

	spotLight.shadow.mapSize.width = 1024;
	spotLight.shadow.mapSize.height = 1024;

	spotLight.shadow.camera.near = 500;
	spotLight.shadow.camera.far = 4000;
	spotLight.shadow.camera.fov = 30;

	mainScene.add( spotLight );
}

function viewObjectInHud( object ){

	if( object != null && object.id != objectinMain ){

		hudScene.remove(objectInHud);
		objectinMain = object.id;
		objectInHud = object.clone();
		objectInHud.position.set(0,0,0);
		hudScene.add( objectInHud );

	} else if ( object == null ){

		hudScene.remove(objectInHud);
		objectinMain = null;

	}

}

function initAudio(){

}

function initMain(){

	mainRenderer = new THREE.WebGLRenderer();
	mainRenderer.setClearColor( 0x000033, 1.0 );
	
	mainRenderer.shadowMap.enabled = true;
	mainRenderer.shadowMap.type = THREE.PCFSoftShadowMap;

	mainCamera = new THREE.PerspectiveCamera( 45, 1, 0.1, 10000 );
	mainCamera.position.set(5,20,15);
	mainCamera.lookAt( mainScene.position );

	$("#mainView").append( mainRenderer.domElement );

}

function initHUD(width, height){

	hudRenderer = new THREE.WebGLRenderer({ alpha: true });
	
	hudRenderer.shadowMap.enabled = true;

	hudCamera = new THREE.PerspectiveCamera( 45, 1, 0.1, 10000 );
	hudCamera.position.set(0,10,10);

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

//Mousetrap.bind('m', function(){ muted = !muted; }, false);

function render(){

	if(!paused){

		handleMouse();

		if( board != null )
			board.quarters[3].spin();

	}

	if(objectInHud != null && objectinMain != null){

		objectInHud.rotation.copy( mainScene.getObjectById(objectinMain).rotation );

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

	//if( objectInHud != null && objectinMain != null )
		//objectInHud.rotation.copy( mainScene.getObjectById(objectinMain).rotation );

}

//window.addEventListener("mousedown", function(e){ board.quarters[3].spinLeft(); } , false);

$('html').mousedown( function(e){

	if( e.which === 1 ){
		board.quarters[3].spinLeft();
	}else if( e.which === 2){

	}else if( e.which ===3){
		e.preventDefault();
		board.quarters[3].spinRight();
		return false; 
	}

});
document.oncontextmenu = function() {
    return false;
}
/*window.addEventListener("contextmenu", function(e){ 
	e.preventDefault();
	board.quarters[3].spinRight();
	return false; 
} , false);*/
window.addEventListener("mouseup", function(e){ mouseDown = false; } , false);

window.addEventListener("mousemove", function(e){ handleMouseMovement(e); } , false);

window.addEventListener('keyup', handleKeyUp, false);
window.addEventListener('keydown', handleKeyDown, false);

function handleKeyDown(event){ 

	if( event.keyCode == 37 ){
		left = true;
		console.log("left");
	}else if( event.keyCode == 38 ){
		up = true;
		console.log("up");
	}else if( event.keyCode == 39 ){
		right = true;
	}else if( event.keyCode == 40 ){
		down = true;
	}

}

function handleKeyUp(event){ 

	if( event.keyCode == 37 ){
		left = false;
		console.log("!left");
	}else if( event.keyCode == 38 ){
		up = false;
		console.log("!up");
	}else if( event.keyCode == 39 ){
		right = false;
	}else if( event.keyCode == 40 ){
		down = false;
	}

}

function handleMouseMovement(e){

	const newX = ( event.clientX / window.innerWidth ) * 2 - 1;
	const newY = -( event.clientY / window.innerHeight ) * 2 + 1;

	mouse.x = newX;
	mouse.y = newY;
	
}