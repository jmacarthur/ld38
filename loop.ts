/// <reference path="draw_world.ts" />
/// <reference_path="levels.ts" />
var canvas = document.getElementsByTagName('canvas')[0];
var ctx = null;
var body = document.getElementsByTagName('body')[0];
var keysDown : boolean[] = new Array();
var SCREENWIDTH  = 640;
var SCREENHEIGHT = 480;
var canvasHeight : number, canvasWidth : number;
var canvasLeft : number, canvasTop : number;
enum Mode { TITLE, PLAY, WIN };
var winBitmap, titleBitmap; 
var winctx, titlectx;
var mode : Mode;
var stopRunloop: boolean;
var playerBox;
var grounded : boolean = true;
var previous_y_velocity : number = 0;
var platforms : Platform[];
var platform_bodies : any[];
var translation_y: number = 0;
var world_rotation: number = -0.005;
var world_rotation_speed : number = 0.0;
var playerImage : Image;
var brickImage : Image;
var worldImage : Image;
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
var levels;

class Platform {
    x : number;
    y: number;
    width:number;
    height:number;
    constructor(x : number, y: number, width: number, height:number) {
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
    }
}

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

function press(c) {
    console.log("press "+c);
    if(c==32) {
	if(mode == Mode.TITLE) {
	    resetGame();
	    mode = Mode.PLAY;
	}
    } else {
	keysDown[c] = true;
    }
}

function unpress(c) {
    keysDown[c] = false;
}

function createBall(world, x, y, rad, fixed = false, density = 1.0) {
    var ballShape = new b2CircleDef();
    if (!fixed) ballShape.density = 10.0;
    ballShape.radius = rad || 10;
    ballShape.restitution = 0.1; // How bouncy the ball is
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
    if (!fixed) boxSd.density = 0.25;
    boxSd.extents.Set(width/2, height/2);
    boxSd.friction = 0.0;
    var boxBd = new b2BodyDef();
    boxBd.AddShape(boxSd);
    boxBd.preventRotation = true;
    boxBd.position.Set(x+width/2,y+height/2);
    return world.CreateBody(boxBd)
}

function createPlatforms(world) {
    platforms = new Array();
    var level : any = levels["Level 1"]["map"];
    var platform_width : number = 0;
    var platform_start : number = 0;
    for(var l = 0;l< level.length; l++) {
	var line : string = level[l];
	platform_width = 0;
	for (var x =0;x<line.length;x++) {
	    if(line[x] == '#') {
		if(platform_width == 0) {
		    platform_start = x;
		}
		platform_width += 1;
	    } else {
		if(platform_width > 0) {
		    platforms.push(new Platform(platform_start*32, l*32, 32*platform_width, 32));
		    platform_width = 0;
		}
	    }
	}
	if(platform_width > 0) {
	    platforms.push(new Platform(platform_start*32, l*32, 32*platform_width, 32));
	}

    }
    platform_bodies = [];
    for(var i:number=0;i<platforms.length;i++) {
	var p : Platform = platforms[i];
	platform_bodies.push(createBox(world, p.x,p.y,p.width,p.height,true));
    }

}

function createWorld() {
    var worldAABB = new b2AABB();
    worldAABB.minVertex.Set(-1000, -1000);
    worldAABB.maxVertex.Set(1000, 1000);
    var gravity = new b2Vec2(0, 98.1);
    var doSleep = true;
    var world = new b2World(worldAABB, gravity, doSleep);

    createPlatforms(world);

    playerBox = createBox(world, 320-16,240,32,64, false);

    return world;
}

function firstTimeInit(): void
{
    playerImage = getImage("player-upscaled");
    brickImage = getImage("brick-upscaled");
    worldImage = getImage("world");
}

function processKeys(): void
{
    if(keysDown[37] || keysDown[65]) {
	playerBox.ApplyForce( new b2Vec2(-100000, 0), playerBox.GetCenterPosition() );
	playerBox.WakeUp();
    }
    if(keysDown[39] || keysDown[68]) {
	playerBox.ApplyForce( new b2Vec2(100000, 0), playerBox.GetCenterPosition() );
	playerBox.WakeUp();
    }
    if(keysDown[32] && grounded) {
	playerBox.ApplyImpulse( new b2Vec2(0, -100000), playerBox.GetCenterPosition() );
	console.log("Jump");
	grounded = false;
	playerBox.WakeUp();
    }
    if(keysDown[38] || keysDown[87]) {
	world_rotation += 0.1;
    }
}

function horizontalFriction() : void
{
    // This provides artifical horizontal friction. We don't
    // do this in box2d as box2d friction prevents jumping.
    var vel = playerBox.GetLinearVelocity();
    vel.x = vel.x * 0.9;
    playerBox.SetLinearVelocity(vel);
}

function checkGrounded(): void
{
    // Because collision detection isn't in this version of box2d,
    // fudge ground detection: You can jump if you're falling
    // at a fixed rate (or zero) - if you are in free fall, then
    // your velocity will always be increasing.
    var vel = playerBox.GetLinearVelocity();
    var delta_y = vel.y - previous_y_velocity;
    grounded = (delta_y < 1 && delta_y > -1);
    previous_y_velocity = vel.y;

    accel = delta_y - 3.27;
    var pos = playerBox.GetCenterPosition();
    world_rotation_speed += Math.abs(accel)*(pos.x-320)*0.0001;
    world_rotation_speed *= 0.9;
    world_rotation += world_rotation_speed*0.01;
}

function centre_viewing_window(): void
{
    var pos = playerBox.GetCenterPosition();
    if((pos.y - 380) > translation_y) {
	translation_y += 4;
    }
    else if((pos.y - 100) < translation_y) {
	translation_y -= 4;
    }
    ctx.setTransform(1,0,0,1,0,-translation_y);
}

function rotate_world()
{
    for(var i : number = 0; i<platform_bodies.length; i++) {
	var rot = world_rotation;
	var x = platforms[i].x + platforms[i].width/2- 320; var y = platforms[i].y + platforms[i].height/2 - 240;
	var nx = x*Math.cos(rot)-y*Math.sin(rot);
	var ny = x*Math.sin(rot)+y*Math.cos(rot);
	var pos = new b2Vec2(nx+320,ny+240);
	platform_bodies[i].SetCenterPosition(pos, rot + 0.01);
	playerBox.WakeUp();
    }
}

function drawBitmap(ctx) : void
{
    ctx.fillStyle = "black";
    ctx.fillRect(0, translation_y, canvasWidth, canvasHeight);
    var pos = playerBox.GetCenterPosition();

    ctx.save();
    ctx.translate(320,240);
    ctx.rotate(world_rotation);
    ctx.translate(-320,-240);

    ctx.drawImage(worldImage, -405+320,-405+240);

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, 640,480);
    
    var level : any = levels["Level 1"]["map"];
    for(var l = 0;l< level.length; l++) {
	var line : string = level[l];
	platform_width = 0;
	for (var x =0;x<line.length;x++) {
	    if(line[x] == '#') {
		ctx.drawImage(brickImage, x*32, l*32);
	    }
	}
    }
    ctx.restore();
    ctx.drawImage(playerImage, pos.x-16, pos.y-32);

}

function step(cnt) {
    if(stopRunloop) return;
    var stepping = false;
    var timeStep = 1.0/30;
    var iteration = 1;
    processKeys();
    horizontalFriction();
    checkGrounded();
    rotate_world();
    world.Step(timeStep, iteration);
    ctx.setTransform(1,0,0,1,0,0);
    centre_viewing_window();
    //drawWorld(world, ctx); // For Box2Djs
    drawBitmap(ctx);
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

    body.onkeydown = function (event) {
	var c = event.keyCode;
	keysDown[c] = true;
	if(c == 81) {
	    stopRunloop=true;
	}	
    }
    body.onkeyup = function (event) {
	var c = event.keyCode;
	keysDown[c] = false;
    };

    canvas.addEventListener('contextmenu', function(e) {
	/* Right click - does nothing. */
	console.log("Right click");
	return false;
    });
    step(0);
};

