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

var muted = false, paused = true, winner = 0;

var left = false, right = false, up = false, down = false;

var objectInHud, objectinMain;

var board = null;
var move = 1, turnMode = false;

var clickSound, scrapeSound, confirmSound, music;

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

	this.quarters[0] = new Quarter(quarterGeometry, quarterMaterials, -1, -1, 0);
	this.quarters[1] = new Quarter(quarterGeometry, quarterMaterials, -1, 1, 1);
	this.quarters[2] = new Quarter(quarterGeometry, quarterMaterials, 1, 1, 2);
	this.quarters[3] = new Quarter(quarterGeometry, quarterMaterials, 1, -1, 3);

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

	this.updateSpin = function(){

		var noSpin = false;

		for( var i = 0; i < 4; i++ )
			noSpin = noSpin || this.quarters[i].spin();

		if( !noSpin )
			scrapeSound.pause();

		return noSpin;

	}

	this.updateTurnMode = function(){

		for( var i = 0; i < 4; i++ )
			this.quarters[i].updateTurnMode();

	}

	this.handleIntersects = function(){

		for( var i = 0; i < 4; i++ )
			if( this.quarters[i].handleIntersects() )
				break;

	}

	this.findStoneById = function( id ){

		for( var i = 0; i < 4; i++ ){
			var stone = this.quarters[i].findStoneById( id );
			if( stone != null )
				return stone;
		}

		return null;

	}

	this.checkForWin = function(){

		var boardArr = this.getBoardArray();

		function checkLine( iStart, jStart, iStep, jStep, totalSteps ){

			var i = iStart, j = jStart;

			var test = boardArr[i][j];
			var count = 1;

			for( var k = 1; k < totalSteps; k++){
				i += iStep;
				j += jStep;
				if( test === boardArr[i][j] ){
					test = boardArr[i][j];
					count++;
					if( count === 5 )
						break;
				}else{
					test = boardArr[i][j];
					count = 1;
				}
			}

			if( count >= 5 )
				return test;
			else
				return 0;

		}

		var win = 0, test;

		// Check columns
		for( var i = 0; i < 6; i++){
			test = checkLine( i, 0, 0, 1, 6);
			if( win == 0 )
				win = test;
			else if( win != 0 && win != test && test != 0 )
				win = 3;
		}

		// Check rows
		for( var i = 0; i < 6; i++){
			test = checkLine( 0, i, 1, 0, 6);
			if( win == 0 )
				win = test;
			else if( win != 0 && win != test && test != 0 )
				win = 3;
		}

		// Check Diagonals
		test = checkLine( 1, 0, 1, 1, 5 );
		if( win == 0 )
			win = test;
		else if( win != 0 && win != test && test != 0 )
			win = 3;

		test = checkLine( 0, 0, 1, 1, 6 );
		if( win == 0 )
			win = test;
		else if( win != 0 && win != test && test != 0 )
			win = 3;

		test = checkLine( 0, 1, 1, 1, 5 );
		if( win == 0 )
			win = test;
		else if( win != 0 && win != test && test != 0 )
			win = 3;

		test = checkLine( 0, 4, 1, -1, 5 );
		if( win == 0 )
			win = test;
		else if( win != 0 && win != test && test != 0 )
			win = 3;

		test = checkLine( 0, 5, 1, -1, 6 );
		if( win == 0 )
			win = test;
		else if( win != 0 && win != test && test != 0 )
			win = 3;

		test = checkLine( 1, 5, 1, -1, 5 );
		if( win == 0 )
			win = test;
		else if( win != 0 && win != test && test != 0 )
			win = 3;

		winner = win;

		return win;


	}

	this.getBoardArray = function(){

		var array = new Array();

		for( var i = 0; i < 6; i++ )
			array[i] = new Array();

		for( var i = 0; i < 3; i++ )
			for( var j = 0; j < 3; j++){
				array[i][j] = this.quarters[0].stones[i][j].state;
				array[i+3][j] = this.quarters[1].stones[i][j].state;
				array[i+3][j+3] = this.quarters[2].stones[i][j].state;
				array[i][j+3] = this.quarters[3].stones[i][j].state;
			}

		return array;

	}

}

function Quarter(geometry, materials, x, z, index){

	this.mesh = new THREE.Mesh(geometry, materials);
	this.mesh.castShadow = true;
	this.mesh.name = "quarter";

	this.index = index;

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
	loader.load('./Models/arrow.json', function(geometry, materials){ this.createArrows(geometry, materials); }.bind(this));

	this.tranparentMaterial = new THREE.MeshBasicMaterial({visible: false});
	this.whiteMaterial = new THREE.MeshPhongMaterial({color: 'white', shininess: 300});
	this.leftArrow
	this.rightArrow

	this.createArrows = function(geometry, materials){

		this.leftArrow = new THREE.Mesh(geometry, this.tranparentMaterial)
		this.leftArrow.position.copy( this.mesh.position );
		this.leftArrow.position.y += 1;
		this.leftArrow.rotation.y = 0.4 + (this.index-1)*Math.PI/2;
		if( this.index % 2 == 0 ){

			this.leftArrow.position.z += 4 * this.z;
			this.leftArrow.position.x += 2.5 * this.x;

		}else{

			this.leftArrow.position.x += 4 * this.x;
			this.leftArrow.position.z += 2.5 * this.z;

		}
		this.leftArrow.scale.set(2,2,2);
		mainScene.add(this.leftArrow);

		this.rightArrow = new THREE.Mesh(geometry, this.tranparentMaterial)
		this.rightArrow.position.copy( this.mesh.position );
		this.rightArrow.position.y += 1;
		if( this.index % 2 == 1 ){

			this.rightArrow.position.z += 4 * this.z;
			this.rightArrow.position.x += 2.5 * this.x;

		}else{

			this.rightArrow.position.x += 4 * this.x;
			this.rightArrow.position.z += 2.5 * this.z;

		}
		this.rightArrow.rotation.y = 0.4 - (this.index*Math.PI/2);
		this.rightArrow.rotation.x = Math.PI;
		this.rightArrow.scale.set(2,2,2);
		mainScene.add(this.rightArrow);
	}

	this.createStones = function(geometry, materials){

		var bump = new THREE.TextureLoader().load( './Textures/plasticbumpmap.png' );
		var whiteMaterial = new THREE.MeshPhongMaterial({color: 'white', specularMap: bump, bumpScale: 0.2, shininess: 300});
		var blackMaterial = new THREE.MeshPhongMaterial({color: 'black', specularMap: bump, bumpScale: 0.2, shininess: 300});

		for( var i = 0; i < 3; i++ ){
			for( var j = 0; j < 3; j++ ){

				var stone = new Stone(geometry, whiteMaterial, blackMaterial, j, i);
				this.mesh.add(stone.mesh);
				this.stones[i][j] = stone;

			}
		}

	}

	this.handleIntersects = function(){

		if( !turnMode ){

			for( var i = 0; i < 3; i++ )
				for( var j = 0; j < 3; j++ )
					if( this.stones[i][j].handleIntersect() )
						return true;

		}else{

			if( raycaster.intersectObject( this.leftArrow ).length > 0 ){
				this.spinLeft();
				switchTurn();
			}else if( raycaster.intersectObject( this.rightArrow ).length > 0 ){
				this.spinRight();
				switchTurn();
			}

		}



	}

	this.updateTurnMode = function(){

		if( turnMode ){
			this.rightArrow.material = this.whiteMaterial;
			this.leftArrow.material = this.whiteMaterial;
		}else{
			this.rightArrow.material = this.tranparentMaterial;
			this.leftArrow.material = this.tranparentMaterial;
		}

	}

	this.findStoneById = function( id ){

		for( var i = 0; i < 3; i++ )
			for( var j = 0; j < 3; j++ ){
				if( this.stones[i][j].mesh.id == id ){
					return this.stones[i][j];
				}
			}

		return null;

	}

	this.spinLeft = function( ){

		if( !muted )
			scrapeSound.play();

		this.targetAngle -= Math.PI/2;

		var rotated = new Array();

		rotated[0] = [ this.stones[2][0], this.stones[1][0], this.stones[0][0] ];
		rotated[1] = [ this.stones[2][1], this.stones[1][1], this.stones[0][1] ];
		rotated[2] = [ this.stones[2][2], this.stones[1][2], this.stones[0][2] ];

		this.stones = rotated;

	}

	this.spinRight = function( ){

		if( !muted )
			scrapeSound.play();

		this.targetAngle += Math.PI/2;

		var rotated = new Array();

		rotated[0] = [ this.stones[0][2], this.stones[1][2], this.stones[2][2] ];
		rotated[1] = [ this.stones[0][1], this.stones[1][1], this.stones[2][1] ];
		rotated[2] = [ this.stones[0][0], this.stones[1][0], this.stones[2][0] ];

		this.stones = rotated;
	}

	this.spin = function(){

		if( this.targetAngle > this.mesh.rotation.y )
			this.mesh.rotation.y += Math.min(this.spinSpeed,this.targetAngle-this.mesh.rotation.y);
		else if( this.targetAngle < this.mesh.rotation.y )
			this.mesh.rotation.y += Math.max(-this.spinSpeed,this.targetAngle-this.mesh.rotation.y);
		else{
			return false;
		}

		this.setPositionFromAngle();

		return true;

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

		if( raycaster.intersectObject( this.mesh ).length > 0 && this.state === 0 ){
			this.move();
			return true;
		}else{
			return false;
		}


	}

	this.move = function(){
		if( !muted )
			clickSound.play();
		this.setColor(move);
		turnMode = true;
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

	// Found at https://freesound.org/people/lebcraftlp/sounds/192278/
	clickSound = new Audio('Sounds/click.wav');

	// Found at https://freesound.org/people/AntumDeluge/sounds/188055/
	scrapeSound = new Audio('Sounds/scrape.wav');
	scrapeSound.loop = true;

	// Found at https://freesound.org/people/InspectorJ/sounds/403018/
	confirmSound = new Audio('Sounds/confirmation.wav');

	// Found at https://freesound.org/people/carpuzi/sounds/382327/
	music = new Audio('Sounds/music.wav');
	music.loop = true;
	if( !muted )
		music.play();

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

function switchTurn(){

	if( move == 1 )
		move = 2;
	else if( move == 2 )
		move = 1;

	turnMode = !turnMode;

	board.updateTurnMode();
	board.checkForWin();

}

function render(){

	if(!paused){
		if( board != null )
			if( !board.updateSpin() ){

				if( winner == 1 )
					$('#winDisplay').html('Black Wins!');
				else if( winner == 2 )
					$('#winDisplay').html('White Wins!');
				else if( winner == 3 )
					$('#winDisplay').html('Draw!');

				if( winner != 0 ){
					if( !muted )
						confirmSound.play();
					$('#winDisplay').show(120);
					$('#playAgain').show(120);
					paused = true;
				}

			}
	}else{
		rotateCamera(0.001, 0);
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

$('html').mousedown( function(e){

	if( !paused )
		if( e.which === 1 ){
			raycaster.setFromCamera( mouse, mainCamera );
			board.handleIntersects();
			board.updateTurnMode();
		}else if( e.which === 2){
			mouseDown = true;
		}else if( e.which ===3){
			e.preventDefault();
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

	if( !paused )
		if( e.which === 1 ){

		}else if( e.which === 2){
			mouseDown = false;
		}else if( e.which ===3){

			e.preventDefault();
			return false; 

		}

});
$(document).ready(function(){

	$('#infoWindow').hide();

	$('#howPlay').click( function(){
		$('#infoWindow').show(120);
	})

	$('#close').click( function(){
		$('#infoWindow').hide(120);
	})

	$('#muteImg').click( function(){

		if( muted ){
			music.play();
			$('#muteImg').attr("src", '/Textures/Antu_audio-on.svg');
		}else{
			music.pause();
			clickSound.pause();
			scrapeSound.pause();
			confirmSound.pause();
			$('#muteImg').attr("src", '/Textures/Antu_audio-off.svg');
		}

		muted = !muted;

	});

	$('#playAgain').click( function(){

		if( !muted )
			confirmSound.play();
		music.volume = 0.5;

		if( winner == 0 ){

			$('#logo').hide(120);
			$('#playAgain').hide(120, function(){
				$('#playAgain').html("PLAY AGAIN?");
				paused = false;
			});
			$('#howPlay').hide(120);
			

		}else
			location.reload();

	}.bind(this));
}.bind(this));

window.addEventListener("mousemove", function(e){ handleMouseMovement(e); } , false);

window.addEventListener('keyup', handleKeyUp, false);
window.addEventListener('keydown', handleKeyDown, false);

function handleKeyDown(event){ 

	if( event.keyCode == 37 ){
		left = true;
	}else if( event.keyCode == 38 ){
		up = true;
	}else if( event.keyCode == 39 ){
		right = true;
	}else if( event.keyCode == 40 ){
		down = true;
	}

}

function handleKeyUp(event){ 

	if( event.keyCode == 37 ){
		left = false;
	}else if( event.keyCode == 38 ){
		up = false;
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

		rotateCamera(dX, dY);

	}

	mouse.x = newX;
	mouse.y = newY;
	
}

function rotateCamera(dX, dY){
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