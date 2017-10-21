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
var move = 1, turnMode = false;

var loader = new THREE.JSONLoader();

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
	this.base = null;

	this.size = 3.2;

	this.quarters[0] = new Quarter(quarterGeometry, quarterMaterials, 1, -1);
	this.quarters[1] = new Quarter(quarterGeometry, quarterMaterials, -1, -1);
	this.quarters[2] = new Quarter(quarterGeometry, quarterMaterials, -1, 1);
	this.quarters[3] = new Quarter(quarterGeometry, quarterMaterials, 1, 1);

	mainScene.add(this.quarters[0].mesh);
	mainScene.add(this.quarters[1].mesh);
	mainScene.add(this.quarters[2].mesh);
	mainScene.add(this.quarters[3].mesh);

	loader.load('./Models/base.json', function(geometry, materials){

		var bump = new THREE.TextureLoader().load( './Textures/plasticbumpmap.png' );
		this.base = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color: 'white', bumpMap: bump, bumpScale: 0.1, shininess: 5}) );
		this.base.position.set( 0, -1, 0 );
		this.base.castShadow = true;
		this.base.recieveShadow = true;
		this.base.scale.set( 0.7, 1, 0.7 );
		mainScene.add( this.base );

	}.bind(this));

	this.handleIntersects = function(){

		for( var i = 0; i < 4; i++ )
			this.quarters[i].handleIntersects();

	}

	this.findStoneById = function( id ){

		for( var i = 0; i < 4; i++ ){
			var stone = this.quarters[i].findStoneById( id );
			if( stone != null )
				return stone;
		}

		return null;

	}

}

function Quarter(geometry, materials, x, z){

	this.mesh = new THREE.Mesh(geometry, materials);
	this.mesh.castShadow = true;
	this.mesh.name = "quarter";

	this.size = 3.3;
	this.targetAngle = 0;
	this.spinSpeed = 0.05;
	this.x = x;
	this.z = z;

	this.stones = new Array();
	this.stones[0] = new Array();
	this.stones[1] = new Array();
	this.stones[2] = new Array();

	this.mesh.position.set(this.x*this.size,0,this.z*this.size);

	loader.load('./Models/stone.json', function(geometry, materials){ this.createStones(geometry, materials); }.bind(this));

	this.createStones = function(geometry, materials){

		var bump = new THREE.TextureLoader().load( './Textures/plasticbumpmap.png' );
		var whiteMaterial = new THREE.MeshPhongMaterial({color: 'white', specularMap: bump, bumpScale: 0.2, shininess: 300});
		var blackMaterial = new THREE.MeshPhongMaterial({color: 'black', specularMap: bump, bumpScale: 0.2, shininess: 300});

		for( var i = 0; i < 3; i++ ){
			for( var j = 0; j < 3; j++ ){

				var stone = new Stone(geometry, whiteMaterial, blackMaterial, i, j);
				this.mesh.add(stone.mesh);
				this.stones[i][j] = stone;

			}
		}

	}

	this.handleIntersects = function(){

		for( var i = 0; i < 3; i++ )
			for( var j = 0; j < 3; j++ )
				this.stones[i][j].handleIntersect();

	}

	this.findStoneById = function( id ){

		console.log('id:' + id);

		for( var i = 0; i < 3; i++ )
			for( var j = 0; j < 3; j++ ){
				console.log( 'stoneID:' + this.stones[i][j].mesh.id );
				if( this.stones[i][j].mesh.id == id ){
					return this.stones[i][j];
				}
			}

		return null;

	}

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

function Stone( geometry, whiteMaterial, blackMaterial, x, z){

	this.state = 0;
	this.whiteMaterial = whiteMaterial;
	this.blackMaterial = blackMaterial;
	this.tranparentMaterial = new THREE.MeshBasicMaterial({visible: false});

	this.mesh = new THREE.Mesh(geometry, this.tranparentMaterial);
	this.mesh.scale.set( 0.7, 0.7, 0.7 );
	this.mesh.recieveShadow = true;
	this.mesh.position.set( 2 * (x-1), 0.5, 2 * (z-1) );
	this.mesh.name = "stone";

	this.handleIntersect = function(){

		if( raycaster.intersectObject( this.mesh ).length > 0 )
			this.move();

	}

	this.move = function(){

		if( turnMode == false ){
			this.setColor(move);
			this.turnMode = true;
		}

	}

	this.setColor = function( newColor ){

		this.state = newColor;

		if( newColor == 0 ){
			this.mesh.material = this.tranparentMaterial;
		}else if( newColor == 1 ){
			this.mesh.material = this.blackMaterial;
		}else if( newColor == 2 ){
			this.mesh.material = this.whiteMaterial;
		}

	}

}

function initScene(){

	mainScene = new THREE.Scene();

	loader.load('./Models/pentago.json', function(geometry, materials){
		var texture = new THREE.TextureLoader().load( "./Textures/plastic.png" );
		var bump = new THREE.TextureLoader().load( './Textures/plasticbumpmap.png' );
		board = new Board(geometry, new THREE.MeshPhongMaterial({map: texture, specularMap: bump, bumpMap: bump, bumpScale: 0.1, shininess: 50}) );
	})

	loader.load('./Models/table.json', function(geometry, materials){

		var texture = new THREE.TextureLoader().load( './Textures/wood.jpg' );

		var table = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({map: texture, shininess: 90}))
		table.recieveShadow = true;
		table.position.set( 0, -2, 0 );
		mainScene.add(table);
	})

	loader.load('./Models/arrow.json', function(geometry, materials){

		var bump = new THREE.TextureLoader().load( './Textures/plasticbumpmap.png' );

		var arrow = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color: 'white', bumpMap: bump, bumpScale: 0.1, shininess: 90}))
		arrow.position.set( 5, 1, 6.2 );
		arrow.rotation.y = Math.PI/2 + 0.2;
		mainScene.add(arrow);

		var arrow2 = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color: 'white', bumpMap: bump, bumpScale: 0.01, shininess: 90}))
		arrow2.position.set( 6.2, 1, 5 );
		arrow2.rotation.y = Math.PI+0.2;
		arrow2.rotation.x = Math.PI;
		mainScene.add(arrow2);
	})

	hudScene = new THREE.Scene();

}

function initLights(){
    var spotLight = new THREE.SpotLight( 0xffffdd );
	spotLight.position.set( -20, 20, 20 );

	spotLight.castShadow = true;

	spotLight.shadow.mapSize.width = 1024;
	spotLight.shadow.mapSize.height = 1024;

	spotLight.shadow.camera.near = 500;
	spotLight.shadow.camera.far = 4000;
	spotLight.shadow.camera.fov = 30;

	mainScene.add( spotLight );

	hudScene.add( spotLight.clone() );
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
	mainRenderer.setClearColor( 0x050505, 1.0 );
	
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

		/*raycaster.setFromCamera( mouse, mainCamera );
		var intersects = raycaster.intersectObjects( mainScene.children );

		if( intersects.length > 0)
			viewObjectInHud( intersects[0].object );
		else
			viewObjectInHud( null );*/

	//if( objectInHud != null && objectinMain != null )
		//objectInHud.rotation.copy( mainScene.getObjectById(objectinMain).rotation );

}

//window.addEventListener("mousedown", function(e){ board.quarters[3].spinLeft(); } , false);

$('html').mousedown( function(e){

	if( e.which === 1 ){

		raycaster.setFromCamera( mouse, mainCamera );

		board.handleIntersects();

		/*var intersects = raycaster.intersectObjects( mainScene.children );

		for( var i = 0; i < intersects.length; i++ )
			if( intersects[i].object.name = "stone" ){
				var stone = board.findStoneById( intersects[i].object.id );
				if( stone != null )
					stone.setColor(1);
			}*/

		//board.quarters[3].spinLeft();

	}else if( e.which === 2){
		mouseDown = true;
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

$('html').mouseup( function(e){

	if( e.which === 1 ){

	}else if( e.which === 2){
		mouseDown = false;
	}else if( e.which ===3){

		e.preventDefault();
		return false; 

	}

});

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

	const dX = newX - mouse.x;
	const dY = newY - mouse.y;

	if(mouseDown){

		var quat = new THREE.Quaternion().setFromUnitVectors( mainCamera.up, new THREE.Vector3( 0, 1, 0 ) );
		var offset = mainCamera.position.clone();

		offset.applyQuaternion( quat );

		var spherical = new THREE.Spherical();
		spherical.setFromVector3( offset );

		spherical.phi += dY*3;
		spherical.theta -= dX*3;

		spherical.phi = Math.max( Math.min(spherical.phi, Math.PI/2) , 0.02);

		offset.setFromSpherical( spherical );

		offset.applyQuaternion( quat.clone().inverse() );

		mainCamera.position.copy( offset );
		mainCamera.lookAt( mainScene.position );

	}

	mouse.x = newX;
	mouse.y = newY;
	
}