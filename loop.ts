/// <reference path="draw_world.ts" />

var canvas = document.getElementsByTagName('canvas')[0];
var ctx = null;
var body = document.getElementsByTagName('body')[0];
var keysDown = new Array();
var SCREENWIDTH  = 640;
var SCREENHEIGHT = 480;
var canvasHeight : number, canvasWidth : number;
var canvasLeft : number, canvasTop : number;
enum Mode { TITLE, PLAY, WIN };
var winBitmap, titleBitmap; 
var winctx, titlectx;
var mode : Mode;

// Things used by box2djs
var b2CircleDef;
var b2BodyDef;
var b2PolyDef;
var b2Joint;
var b2RevoluteJointDef;
var b2BoxDef, b2AABB;
var b2Vec2, b2World;

// Other external things
var $;

function getImage(name) : Image
{
    image = new Image();
    image.src = 'graphics/'+name+'.png';
    return image;
}

function drawChar(context, c, x, y) 
{
    c = c.charCodeAt(0);
    if(c > 0) {
        context.drawImage(bitfont, c*6, 0, 6,8, x, y, 12, 16);
    }
}

function drawString(context, string, x, y) {
    string = string.toUpperCase();
    for(var i : number = 0; i < string.length; i++) {
	drawChar(context, string[i], x, y);
	x += 12;
    }
}

function paintTitleBitmaps()
{
    drawString(titlectx, 'This is a demo of the JavaScript/HTML5 game loop',32,32);
    drawString(winctx, 'Your game should always have an ending',32,32);
}

function makeTitleBitmaps()
{
    titleBitmap = document.createElement('canvas');
    titleBitmap.width = SCREENWIDTH;
    titleBitmap.height = SCREENHEIGHT;
    titlectx = titleBitmap.getContext('2d');
    winBitmap = document.createElement('canvas');
    winBitmap.width = SCREENWIDTH;
    winBitmap.height = SCREENHEIGHT;
    winctx = winBitmap.getContext('2d');
    bitfont = new Image();
    bitfont.src = "graphics/bitfont.png";
    bitfont.onload = paintTitleBitmaps;
}

function resetGame()
{
}

function init()
{
    mode = Mode.TITLE;
    playerImage = getImage("player");
    springSound = new Audio("audio/boing.wav");
    makeTitleBitmaps();
    return true;
}

function draw() {
    ctx.fillStyle = "#0000ff";
    ctx.fillRect(0, 0, SCREENWIDTH, SCREENHEIGHT);

    if(mode == Mode.TITLE) {
	ctx.drawImage(titleBitmap, 0, 0);
	return;
    }

    if(mode == Mode.WIN) {
	ctx.drawImage(winBitmap, 0, 0);
    }
}

function processKeys() {
    if(keysDown[40] || keysDown[83]);
    if(keysDown[38] || keysDown[87]);
    if(keysDown[37] || keysDown[65]);
    if(keysDown[39] || keysDown[68]);
}

function press(c) {
    console.log("press "+c);
    if(c==32) {
	if(mode == Mode.TITLE) {
	    resetGame();
	    mode = Mode.PLAY;
	}
    } else {
	keysDown[c] = 1;
    }
}

function unpress(c) {
    keysDown[c] = 0;
}

function createBall(world, x, y, rad, fixed = false, density = 1.0) {
    var ballShape = new b2CircleDef();
    if (!fixed) ballShape.density = 10.0;
    ballShape.radius = rad || 10;
    ballShape.restitution = 1.0; // How bouncy the ball is
    ballShape.friction =0;
    var ballBd = new b2BodyDef();
    ballBd.AddShape(ballShape);
    ballBd.linearDamping = 0.01;
    ballBd.position.Set(x,y);
    ballBd.friction =0;
    return world.CreateBody(ballBd);
};

function createBox(world, x, y, width, height, fixed = false) {
    if (typeof(fixed) == 'undefined') fixed = true;
    var boxSd = new b2BoxDef();
    if (!fixed) boxSd.density = 1.0;
    boxSd.extents.Set(width, height);
    var boxBd = new b2BodyDef();
    boxBd.AddShape(boxSd);
    boxBd.position.Set(x,y);
    return world.CreateBody(boxBd)
}

function createWorld() {
    var worldAABB = new b2AABB();
    worldAABB.minVertex.Set(-1000, -1000);
    worldAABB.maxVertex.Set(1000, 1000);
    var gravity = new b2Vec2(0, 9.81);
    var doSleep = true;
    var world = new b2World(worldAABB, gravity, doSleep);
    createBox(world, 0,400,640,8,true);

    ball = createBall(world, 320,240, 30, false, 1.0);

    return world;
}

function firstTimeInit(): void
{
}

function step(cnt) {
    var stepping = false;
    var timeStep = 1.0/60;
    var iteration = 1;
    
    world.Step(timeStep, iteration);
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    drawWorld(world, ctx);
    setTimeout('step(' + (cnt || 0) + ')', 20);
}

var world;
window.onload=function() {
    firstTimeInit();
    world = createWorld();
    ctx = $('canvas').getContext('2d');
    var canvasElm = $('canvas');
    canvasWidth = parseInt(canvasElm.width);
    canvasHeight = parseInt(canvasElm.height);
    canvasTop = parseInt(canvasElm.style.top);
    canvasLeft = parseInt(canvasElm.style.left);
    canvas.addEventListener('click', function(e) {
    });
    canvas.addEventListener('contextmenu', function(e) {
	/* Right click - does nothing. */
	console.log("Right click");
	return false;
    });
    step(0);
};
