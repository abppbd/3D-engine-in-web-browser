/*
  global coords:
  - x: front/back
  - y: right/left
  - z: up/down
*/

var StopAll = false

//canvas init
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const canvas_h = canvas.height;
const canvas_w  = canvas.width;

// keydown init
var keyDown_r = false;
var keyDown_l = false;
var keyDown_f = false;
var keyDown_b = false;
var keyDownLook_r = false;
var keyDownLook_l = false;
var keyDownLook_u = false;
var keyDownLook_d = false;

var cam_x = 0; // Player x coord.
var cam_y = 0; // Player y coord.
var cam_z = 0; // Player z coord.

var p_alpha = 0; // Player alpha angle (right-left motion).
var p_beta = 0; // Player beta angle (up-down motion).

var H_FOV = 90; // Horizontal Field Of View.
var screenDist = FOVtoDist(H_FOV, canvas_w); // Dist screen player/cam
screenDist = 5;

const pos_decimals = 3; // Nb of decimals for position precision.
const rot_decimals = 3; // Nb of decimals for rotation precision.

const geometryFile = "geometry.json";


function loadGeometry (fileName){
  let json = require(geometryFile) // Get file.
  
  let toRender = [] // Init the shapes to render.
  
  for (let i = 0; i < json.length; i++) {
    // Loop over everyshapes in json.
    
    if (json[i]["render"] === true){
      // if "Render" proprety is true add to list.
      toRender.push(json[i]);
    }
  }
  return toRender;
}


function drawLine(x1, y1, x2, y2, center = false){
  let balanceX = 0;
  let balanceY = 0;

  if (center){ // set canvas' center as 0, 0
    balanceX = canvas_w / 2;
    balanceY = canvas_h / 2;
  }
  
  // get coords (rel to center) as int
  x1 = parseInt(x1 + balanceX);
  x2 = parseInt(x2 + balanceX);
  y1 = parseInt(y1 + balanceY);
  y2 = parseInt(y2 + balanceY);

  ctx.beginPath(); //New drawing "context"
  ctx.moveTo(x1, y1); //line start
  ctx.lineTo(x2, y2); //line end
  ctx.stroke(); //update canvas
}


function drawPoint(x, y, radius=10){ // draw cross at x, y
  drawLine(x+radius, y, x-radius, y); // down to up
  drawLine(x, y+radius, x, y-radius); // right to left
}


function drawBorder(){
  drawLine(0, 0, 0, canvas_h, false); //left
  drawLine(0, canvas_h, canvas_w, canvas_h, false); //bottom
  drawLine(canvas_w, canvas_h, canvas_w, 0, false); //right
  drawLine(canvas_w, 0, 0, 0, false); //top
}


// change html element to output
function output(txt, out=1){

  const outputId = "output".concat('', out.toString()); // get output id as str

  if (out > 9 || out < 0){
    console.log("Selected output does not exist.");
    console.log(out)
    return null;
  }

  document.getElementById(outputId).textContent = txt; //output txt
}


// when key is pressed
document.addEventListener("keydown", function(e) {
  if (e.which === 13){ // Stop all when "enter" is pressed
    StopAll = true;
    throw 'Script stoped.';
  }

  if (e.which === 39){ //go right key
    keyDown_r = true;
  }

  if (e.which === 37){ //go left key
    keyDown_l = true;
  }

  if (e.which === 38){ //go forward key
    keyDown_f = true;
  }

  if (e.which === 40){ //go backward key
    keyDown_b = true;
  }

  if (e.which === 68){ //look right key
    keyDownLook_r = true;
  }

  if (e.which === 81){ //look left key
    keyDownLook_l = true;
  }

  if (e.which === 90){ //look up key
    keyDownLook_u = true;
  }

  if (e.which === 83){ //look down key
    keyDownLook_d = true;
  }

  // vv Turn camera vv
  if (keyDownLook_r === true){
    p_alpha += 1;
  }
  if (keyDownLook_l === true){
    p_alpha -= 1;
  }
  if (keyDownLook_u === true){
    p_beta += 1;
  }
  if (keyDownLook_d === true){
    p_beta -= 1;
  }
  // ^^ Turn camera ^^

  // Remove floating point errors.
  let precision = 10 ** rot_decimals
  p_alpha = Math.round(p_alpha * precision) / precision;
  p_beta = Math.round(p_beta * precision) / precision;

  output(["key_front", keyDown_f, " |key_back", keyDown_b, " |key_right: ", keyDown_r, " |key_left: ", keyDown_l], 0);
  // pos var

  output(["key_LU", keyDownLook_u, " |key_LD", keyDownLook_d, " |key_LR", keyDownLook_r, " |key_LL", keyDownLook_l], 1);
  //angl var

  output(["alpha", p_alpha], 2);
  output(["beta", p_beta], 3);
  output(e.which,4);

  // Update screen
  screenUpdate();
});


// when key is released
document.addEventListener("keyup", function(e) {
  if (e.which === 39){ //go right key
    keyDown_r = false;
  }

  if (e.which === 37){ //go left key
    keyDown_l = false;
  }

  if (e.which === 38){ //go forward key
    keyDown_f = false;
  }

  if (e.which === 40){ //go backward key
    keyDown_b = false;
  }

  if (e.which === 68){ //look right key
    keyDownLook_r = false;
  }

  if (e.which === 81){ //look left key
    keyDownLook_l = false;
  }

  if (e.which === 90){ //look up key
    keyDownLook_u = false;
  }

  if (e.which === 83){ //look down key
    keyDownLook_d = false;
  }

  output(["key_front", keyDown_f, " |key_back", keyDown_b, " |key_right: ", keyDown_r, " |key_left: ", keyDown_l], 0);
  // pos var

  output(["key_LU", keyDownLook_u, " |key_LD", keyDownLook_d, " |key_LR", keyDownLook_r, " |key_LL", keyDownLook_l], 1);
  //angl var
});


// -.- (no explanation needed)
function degToRad(deg){
  return rad = deg * Math.PI / 180;
}


// Get distance between player and screen.
function FOVtoDist(FOV, screenLen=canvas_w){
  let dist = screenLen/2 * Math.tan(FOV/2);
  return dist;
}


// "p" are arrays of 2 elements (x, y).
function drawTriangle(p1, p2, p3){
  drawLine(p1[0], p1[1], p2[0], p2[1]);
  drawLine(p2[0], p2[1], p3[0], p3[1]);
  drawLine(p3[0], p3[1], p1[0], p1[1]);
}


// point is [x, y].
function rotatePoint(point, angle, clockwise=true, center=[0,0]){
  // from https://stackoverflow.com/a/17411276

  angle = degToRad(angle);

  if (clockwise){ // reverse angle if clockwise
    angle = -angle;
  }

  let deltaX = point[0] - center [0];
  let deltaY = point[1] - center [1];
  // get point coord relative to center

  let radius = Math.sqrt(deltaX ** 2 + deltaY ** 2);
  // dist from center to point (Pythagorean theorem)

  let newX = (deltaX*Math.cos(angle)) + (deltaY*Math.sin(angle));
  let newY = (deltaY*Math.cos(angle)) - (deltaX*Math.sin(angle));
  // new values for (x, y)

  return [newX, newY];
}


function rotateEuler(point, angle=0, axis=0){ // point=[x, y, z]
  // math from: https://stackoverflow.com/questions/14607640/rotating-a-vector-in-3d-space/14609567#14609567 .

  angle = degToRad(angle);
  let X = point[0];
  let Y = point[1];
  let Z = point[2];

  // axis: 0->X; 1->Y; 2->Z
  if (axis === 0){ // rotation along x axis.
    // angle > 0 -> roll left
    newX = X;
    newY = Y*Math.cos(angle) - Z*Math.sin(angle);
    newZ = Y*Math.sin(angle) + Z*Math.cos(angle);

  } else if (axis === 1){ // rotation along y axis.
    // angle > 0 -> pitch foward/down/dive
    newX = X*Math.cos(angle) + Z*Math.sin(angle);
    newY = Y;
    newZ = -X*Math.sin(angle) + Z*Math.cos(angle);

  } else { // rotation along z axis.
    // angle > 0 -> yaw right/clockwise
    newX = X*Math.cos(angle) - Y*Math.sin(angle);
    newY = X*Math.sin(angle) + Y*Math.cos(angle);
    newZ = Z;
  }

  // Remove floating point errors.
  let precision = 10 ** pos_decimals;
  newX = Math.round(newX * precision) / precision;
  newY = Math.round(newY * precision) / precision;
  newZ = Math.round(newZ * precision) / precision;

  output(["newX:", newX, " | newY:", newY, " | newZ:", newZ], 5);

  return [newX, newY, newZ];
}


// returns coords relative to cam (cancel, pos & rotation offsets)
function relToCam(point){ // point: (x, y, z)
  
  // cancel cam's translation
  let transX = point[0] - cam_x;
  let transY = point[1] - cam_y;
  let transZ = point[2] - cam_z;
  let local_pos = [transX, transY, transZ];

  // cancel alpha cam rotation (yaw, z axis)
  let alphaCancel = rotateEuler(local_pos, -p_alpha, 2);

  //cancel beta cam rotation (pitch, y axis)
  let local_pos_dir = rotateEuler(alphaCancel, p_beta, 1);

  return local_pos_dir;
}


// Project 3D point onto the screen.
function perspectiveProj(point){ // point = [x, y, z]
  // distance from center.
  let xDif = point[1] * screenDist / point[0];
  let yDif = point[2] * screenDist / point[0];

  // get canvas coords.
  let xScreen = canvas_w/2 + xDif;
  let yScreen = canvas_h/2 - yDif;

  /*Xscreen = Sx/2 + (Py*F)/Px
    Yscreen = Sy/2 - (Pz*F)/Px
    Px/y/z: point pos along axis
    F: dist screen to player
    Sx/y: screen size*/

  return [xScreen, yScreen];
}


// Update th screen (not cleared).
function screenUpdate(){
  let point = [2, 0, 0];

  // get point rel to camera
  let localPoint = relToCam(point);

  // project point to screen
  let screenPoint = perspectiveProj(localPoint);

  if (localPoint[0] > 0){
    // render only if in front
    drawPoint(screenPoint[0], screenPoint[1], 10);
  }
  console.log(localPoint, screenPoint);
  return;
}

drawBorder();
drawPoint(0, 0, 2); // draw canvas' center
