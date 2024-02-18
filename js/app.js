/*
  global coords:
  - x: front/back
  - y: right/left
  - z: up/down
*/

var StopAll = false

//canvas init
const canvas = document.getElementById("canvas")
const ctx = canvas.getContext("2d")
const canvas_h = canvas.height
const canvas_w  = canvas.width

// Mvmt keydown init.
var keyDown_u = false // Mv up.
var keyDown_d = false // Mv down.
var keyDown_r = false // Mv right.
var keyDown_l = false // Mv left.
var keyDown_f = false // Mv forward.
var keyDown_b = false // Mv backward.

// Look keydown init.
var keyDownLook_r = false // Lk right.
var keyDownLook_l = false // Lk left.
var keyDownLook_u = false // Lk up.
var keyDownLook_d = false // Lk down.

var cam_x = 0 // Player x coord.
var cam_y = 0 // Player y coord.
var cam_z = 0 // Player z coord.

// Step size along each axis (rel to player alpha angle).
var moveX = 3 // forward/back.
var moveY = 3 // right/left.
var moveZ = 1 // up/down.

var p_alpha = 0 // Player alpha angle (+right / -left).
var p_beta = 0  // Player beta angle (+:up / -:down).

var rotAlpha = 5 // Player alpha angle step.
var rotBeta = 5  // Player beta angle step.

var H_FOV = 90         // Horizontal Field Of View.
var screenDist = 179//FOVtoDist(H_FOV, canvas_w) // Dist screen to player/cam.
var camPlaneClip = 0.5 // Min dist from cam for rendering.

const pos_decimals = 3 // Nb of decimals for position precision.
const rot_decimals = 3 // Nb of decimals for rotation precision.

const toRender = loadJSON()
/*const geometryFile = "file:///C:/Users/lucamorriello/Documents/3Dengine/js/geometry.json"
var json = "placeholder"
// https://stackoverflow.com/a/14446538
*/


// Creates a deep copy of a JS object.
// Thanks to https://stackoverflow.com/a/7574273.
function objectClone(obj){
  if(obj == null || typeof(obj) != 'object')
    return obj

  var temp = new obj.constructor(); 
  for(var key in obj)
    temp[key] = objectClone(obj[key]);

  return temp;
}


function clearCanvas(){
  ctx.clearRect(0, 0, canvas_w, canvas_h)
}


function drawLine(x1, y1, x2, y2, center=false, color="#000000"){

  // Screen (0, 0) is canvas top left corner.
  let balanceX = 0
  let balanceY = 0

  if (center){
    // If the coords given are rel to the canvas' center.

    // Get canvas' center's coords.
    balanceX = canvas_w / 2
    balanceY = canvas_h / 2

    // Get points coords rel to top left corner
    x1 += balanceX
    x2 += balanceX
    y1 += balanceY
    y2 += balanceY
  }

  // Ints required to draw on canvas.
  x1 = parseInt(x1)
  x2 = parseInt(x2)
  y1 = parseInt(y1)
  y2 = parseInt(y2)

  // Compensate Scrren flip:
  // Transform (0,0) from the top left to the bottom left corner.
  y1 = canvas_h - y1
  y2 = canvas_h - y2
  
  if (typeof color != "string"){
    // Assuming the Str given is the hex color.
    //console.log("The color parameter takes a str or an array.")
  }
  
  ctx.strokeStyle = color // Def stroke color.

  ctx.beginPath()    //New drawing "context"
  ctx.moveTo(x1, y1) //line start
  ctx.lineTo(x2, y2) //line end
  ctx.stroke()       //update canvas
}


function drawPoint(x, y, radius=10, color="#000000"){ // draw cross at x, y
  drawLine(x+radius, y, x-radius, y, true, color) // down to up
  drawLine(x, y+radius, x, y-radius, true, color) // right to left
}


// "p" is an arrays of 2 elements (x, y).
function drawTriangle(p1, p2, p3){
  drawLine(p1[0], p1[1], p2[0], p2[1])
  drawLine(p2[0], p2[1], p3[0], p3[1])
  drawLine(p3[0], p3[1], p1[0], p1[1])
}


function drawBorder(){
  drawLine(0, 0, 0, canvas_h, false) //left
  drawLine(0, canvas_h, canvas_w, canvas_h, false) //bottom
  drawLine(canvas_w, canvas_h, canvas_w, 0, false) //right
  drawLine(canvas_w, 0, 0, 0, false) //top
}


// change html element to output
function output(txt, out=1){

  const outputId = "output".concat('', out.toString()) // get output id as str

  if (out > 9 || out < 0){
    console.log("Selected output does not exist.")
    console.log(out)
    return null
  }

  document.getElementById(outputId).textContent = txt //output txt
}


// Moduo operation using the floored division.
function modulo(a, n) {
  // The result has the sign of the divisor.
	return a - (n * Math.floor(a/n))
}


// -.- (no explanation needed)
function degToRad(deg){
  return rad = deg * Math.PI / 180
}


// Set keyDown bool values to boolVal according to the pressed key.
function keyDownValueToBool(keyVal, boolVal){
  if (keyVal == 39){keyDown_r = boolVal} // Go Right.
  if (keyVal == 37){keyDown_l = boolVal} // Go left.
  if (keyVal == 38){keyDown_f = boolVal} // Go forward.
  if (keyVal == 40){keyDown_b = boolVal} // Go backward.
  if (keyVal == 82){keyDown_u = boolVal} // Go up.
  if (keyVal == 70){keyDown_d = boolVal} // Go down.

  if (keyVal == 68){keyDownLook_r = boolVal} // Look right.
  if (keyVal == 81){keyDownLook_l = boolVal} // Look left.
  if (keyVal == 90){keyDownLook_u = boolVal} // Look up.
  if (keyVal == 83){keyDownLook_d = boolVal} // Look down.
}


// Move cam according to which key are pressed.
function moveCam(mF, mB, mR, mL, mU, mD){
  // Variables as m* are boolean, multiplying by 1 or 0
  // the values to offset the cam.
  
  // Separte up/down because they're used less often.

  if (mU || mD){
    // If cam moves up or down.
    cam_z += mU * moveZ // add up movement.
    cam_z -= mD * moveZ // add down movement.
  }

  if (mF || mB || mR || mL){
    // If cam moves forward/backward/right/up.
    
    // Get x & y component when going forward/backward according to player angle.
    // Exchange x & y comp to get right/left components.
    // Components' sign needs to be switched accordingly.
    let alpha_angle = degToRad(p_alpha)
    let comp1 = Math.cos(alpha_angle) * moveX // (forward X)
    let comp2 = Math.sin(alpha_angle) * moveX // (forward Y)

    cam_x += mF * comp1 // add forward movement, x-axis.
    cam_y += mF * comp2 // add forward movement, y-axis.

    cam_x -= mB * comp1 // sub forward movement, x-axis. (backward)
    cam_y -= mB * comp2 // sub forward movement, y-axis. (backward)

    cam_x -= mR * comp2 // add move right, x-axis.
    cam_y += mR * comp1 // add move right, y-axis.

    cam_x += mL * comp2 // add move left, x-axis.
    cam_y -= mL * comp1 // add move left, y-axis.
  }
}


// Rotate cam according to which key are pressed.
function rotateCam(lR, lL, lU, lD, clamp=true){
  p_alpha += lR * rotAlpha // Look right.
  p_alpha -= lL * rotAlpha // Look left.
  p_beta += lU * rotBeta   // Look up.
  p_beta -= lD * rotBeta   // Look down.
  
  if (clamp){
    // If clamping from 0° to 360° is true.

    // Clamping: 0 < angle < 360
    p_alpha = modulo(p_alpha, 360)
    p_beta = modulo(p_beta, 360)
  }
}


function removeFloatError(val, decimalPrecision=3){
  // Get power of 10.
  let precision = 10 ** decimalPrecision

  // Truncate unwanted digits.
  val = Math.round(val * precision) / precision

  return val
}


// when key is pressed
document.addEventListener("keydown", function(e) {
  // e.which is the index of the pressed key.

  if (e.which == 13){ // Stop all when "enter" is pressed (not yet implemented)
    StopAll = true
    throw 'Script stoped. (not really cuz it s not implemented yet)'
  }

  // Set pressed key as true.
  keyDownValueToBool(e.which, true)

  rotateCam(
    keyDownLook_r,
    keyDownLook_l,
    keyDownLook_u,
    keyDownLook_d,
    clamp = true
  )

  moveCam(
    keyDown_f,
    keyDown_b,
    keyDown_r,
    keyDown_l,
    keyDown_u,
    keyDown_d
  )

  // Remove floating point errors from cam angles.
  p_alpha = removeFloatError(p_alpha, rot_decimals)
  p_beta = removeFloatError(p_beta, rot_decimals)

  // Remove floating point errors from cam pos.
  cam_x = removeFloatError(cam_x, pos_decimals)
  cam_y = removeFloatError(cam_y, pos_decimals)
  cam_z = removeFloatError(cam_z, pos_decimals)

  // Show move keys.
  output(
    ["key_front", keyDown_f,
     " |key_back", keyDown_b,
     " |key_right: ", keyDown_r,
     " |key_left: ", keyDown_l,
     " |key_up:", keyDown_u,
     " |key_down:", keyDown_d],
    0
  )

  // Show rotate keys.
  output(
    ["key_LU", keyDownLook_u,
     " |key_LD", keyDownLook_d,
     " |key_LR", keyDownLook_r,
     " |key_LL", keyDownLook_l],
    1
  )

  // Show player angle.
  output(["alpha", p_alpha], 2)
  output(["beta", p_beta], 3)

  // Show keyPressed's index
  output(e.which,4)
  
  updateScreen()
})


// when key is released
document.addEventListener("keyup", function(e) {
  // e.which is the index of the pressed key.

  keyDownValueToBool(e.which, false)

  // Show move keys.
  output(
    ["key_front", keyDown_f,
     " |key_back", keyDown_b,
     " |key_right: ", keyDown_r,
     " |key_left: ", keyDown_l,
     " |key_up:", keyDown_u,
     " |key_down:", keyDown_d],
    0
  )

  // Show rotate keys.
  output(
    ["key_LU", keyDownLook_u,
     " |key_LD", keyDownLook_d,
     " |key_LR", keyDownLook_r,
     " |key_LL", keyDownLook_l],
    1
  )
})


function distPoints (p1, p2){ // Get dist between 2 points in 3D.
  let rel = [p1[0] - p2[0], p1[1] - p2[1], p1[2] - p2[2]]
  let dist = Math.sqrt(rel[0]**2 + rel[1]**2 + rel[2]**2)
  return dist
}


// Get distance between player and screen.
function FOVtoDist(FOV, screenLen=canvas_w){
  let dist = screenLen/2 * Math.tan(FOV/2)
  return dist
}


// point is [x, y].
function rotatePoint(point, angle, clockwise=true, center=[0,0]){
  // from https://stackoverflow.com/a/17411276

  angle = degToRad(angle)

  if (clockwise){ // reverse angle if clockwise
    angle = -angle
  }

  let deltaX = point[0] - center [0]
  let deltaY = point[1] - center [1]
  // get point coord relative to center

  let radius = Math.sqrt(deltaX ** 2 + deltaY ** 2)
  // dist from center to point (Pythagorean theorem)

  let newX = (deltaX*Math.cos(angle)) + (deltaY*Math.sin(angle))
  let newY = (deltaY*Math.cos(angle)) - (deltaX*Math.sin(angle))
  // new values for (x, y)

  return [newX, newY]
}


// Rotation of a point in 3D space. axis: 0->X, 1->Y, 2->Z
function rotateEuler(point, angle=0, axis=0){ // point=[x, y, z]
  // math from: https://stackoverflow.com/questions/14607640/rotating-a-vector-in-3d-space/14609567#14609567 .

  angle = degToRad(angle)
  let X = point[0]
  let Y = point[1]
  let Z = point[2]
  
  let newX = undefined
  let newY = undefined
  let newZ = undefined

  // axis: 0->X; 1->Y; 2->Z
  if (axis == 0){ // rotation along x axis.
    // angle > 0 -> roll left
    newX = X
    newY = Y*Math.cos(angle) - Z*Math.sin(angle)
    newZ = Y*Math.sin(angle) + Z*Math.cos(angle)

  } else if (axis == 1){ // rotation along y axis.
    // angle > 0 -> pitch forward/down/dive
    newX = X*Math.cos(angle) + Z*Math.sin(angle)
    newY = Y
    newZ = -X*Math.sin(angle) + Z*Math.cos(angle)

  } else { // rotation along z axis.
    // angle > 0 -> yaw right/clockwise
    newX = X*Math.cos(angle) - Y*Math.sin(angle)
    newY = X*Math.sin(angle) + Y*Math.cos(angle)
    newZ = Z
  }

  // Remove floating point errors.
  let precision = 10 ** pos_decimals
  newX = Math.round(newX * precision) / precision
  newY = Math.round(newY * precision) / precision
  newZ = Math.round(newZ * precision) / precision

  //output(["newX:", newX, " | newY:", newY, " | newZ:", newZ], 5)

  return [newX, newY, newZ]
}


// Returns coords relative to cam (cancel, pos & rotation offsets).
function relToCam(point){ // point: (x, y, z)
  
  // Cancel cam's translation.
  let transX = point[0] - cam_x
  let transY = point[1] - cam_y
  let transZ = point[2] - cam_z
  let local_pos = [transX, transY, transZ]

  // Cancel alpha cam rotation (yaw, z axis)
  let alphaCancel = rotateEuler(local_pos, -p_alpha, 2)

  // Cancel beta cam rotation (pitch, y axis).
  let local_pos_dir = rotateEuler(alphaCancel, p_beta, 1)

  return local_pos_dir
}


// Project 3D point onto the screen. (canvas center is 0,0).
// point = [x, y, z]
function perspectiveProj(point, conpensateSign=true, debug=false){
  // Assuming Coords have been made local to the camera.
  // aka: Projecting on the YZ plane (X axis is front/back)

  // Distance from center.
  let xDif = 0
  let yDif = 0

  if (point[0] != 0){ // If a point isn't on the YZ plane of the cam.
    // Avoid division by 0.
    xDif = point[1] * screenDist / point[0]
    yDif = point[2] * screenDist / point[0]
  }

  /*
  Xscreen = Sx/2 + (Py*F)/Px
  Yscreen = Sy/2 - (Pz*F)/Px
  Px/y/z: point pos along axis
  F: dist screen to player
  Sx/y: screen size
  */

  // /!\ The projection method flips (x,y) screen coords if the point is behind
  //     cam so a value that sould be positive will be negative and vice versa.
  if (point[0] < 0){
    // If point is behind cam & compensateSign is true.

    // Print debug info if debug is true.
    if (debug){console.log(point, "xDif:", xDif, "|yDif:", yDif)}
    
    if (conpensateSign){
      // Compensate for the sign invertion.
      xDif = -xDif
      yDif = -yDif
    }

    // If a point is behind cam it should be rendered out of FOV
    // An edge from in front to behind the cam will go of screen

    output("CALCULATE CORRECTLY THE PROJECTION FOR POINTS BEHIND CAM!",5)
    
    if (xDif > 0) {
      xDif += canvas_w/2
    } else if (xDif < 0){
      xDif -= canvas_w/2
    }

    if (yDif > 0) {
      yDif += canvas_h/2
    } else if (yDif < 0){
      yDif -= canvas_h/2
    }
  }

  return [xDif, yDif]
}


// Check if a point is in front of the camera (use after applying relToCam).
function isInFront(point, planeCliping = camPlaneClip){ // point = [x, y, z]
  return point[0] - planeCliping > 0
}


// Check if a projected point is on screen.
function inFOV(point){ // point = [x, y]
  let w_min = -canvas_w/2
  let w_max = canvas_w/2
  let h_min = -canvas_h/2
  let , h_max = canvas_h/2

  if ((w_min < point[0] < w_max) & (h_min < point[1] < h_max)){
    return true
  } else {
    return false
  }
}


// Apply shape's pos & rot to it's vertices to get their global coords.
function applyTransform(vertices, shapePos, shapeRot){
  // localVert: list of Vertices local coords rel to their shape.

  // Duplicate the original array to not modify it.
  let localVert = objectClone(vertices)

  // Apply rot first pos second cuz rot is done around the origin.
  for (vertIdx in localVert){
    // Loop over every vertex.

    // Get vertex coords array.
    vertCo = localVert[vertIdx]["point"]

    if (shapeRot[1]){
      // If beta rotation is non 0.
      // Rotate around the Y axis (beta_angle).
      Object.assign(vertCo, rotateEuler(vertCo, shapeRot[1], 1))
    }

    if (shapeRot[0]){
      // If alpha rotation is non 0.
      // Rotate around the Z axis (alpha_angle).
      Object.assign(vertCo, rotateEuler(vertCo, shapeRot[0], 2))
    }

    // A shape has probably always some pos transform so no check.
    // Also remove float error.
    for (axisIdx in vertCo){
      // Loop over each coord in a vertex.
      // Add the shape's pos to the vertex's coresponding coord.
      vertCo[axisIdx] += shapePos[axisIdx]
      // Remove float error.
      vertCo[axisIdx] = removeFloatError(vertCo[axisIdx], pos_decimals)
    }
  }
  return localVert
}


function renderVertex(vert){
  for(vertIdx in vert){
    // Loop over every vertex.

    // Get vertex coords.
    vertCo = vert[vertIdx]["point"]

    if (isInFront(vertCo)){
      // If the vertex is in front of the ZY plane.

      // Project point onto the screen.
      screenProj = perspectiveProj(vertCo)

      // Draw the point.
      drawPoint(screenProj[0], screenProj[1], 4, vert[vertIdx]["color"])
    }
  }
}


function renderEdge(vert, edges){
  // "vert" is the list of vertices and "edge" is the edges_keys associated.

  for(edgeIdx in edges){
    // Loop over every edge.

    // Get edge's vertices' coords.
    v1 = vert[edges[edgeIdx]["edge"][0]]["point"]
    v2 = vert[edges[edgeIdx]["edge"][1]]["point"]

    if (isInFront(v1) || isInFront(v2)){
      // If either of the edge's vertices are in front of the ZY plane.

      // Project the points onto the screen.
      v1Proj = perspectiveProj(v1)
      v2Proj = perspectiveProj(v2)

      // Draw the point.
      drawLine(v1Proj[0], v1Proj[1], v2Proj[0], v2Proj[1], true,
        edges[edgeIdx]["color"])
    }
  }
}

// Unify vertex, edge & face rendering to speed it up.
function rendering(geometry, renderV=true, renderE=true, renderF=true){
  for (const shapeIdx in geometry) {
    // Loop over every shape.

    let shape = geometry[shapeIdx]

    if (shape["isRendered"] == true){
      // If shape should be rendered.

      // Apply Pos & Rot transforms.
      let globalVert = applyTransform(shape["points"],shape["position"],shape["rotation"])

      // Get each vertex pos relative to the cam.
      let relVert = globalVert.map(
        function (vert, idx){
          vert["point"] = relToCam(vert["point"])
          return vert
        })

      if (renderV & geometry[shapeIdx]["mode"].includes("p")){
        // If vertex and shape vertex mode are enabled, render vertices.
        renderVertex(relVert)
      }

      if (renderE & geometry[shapeIdx]["mode"].includes("e")){
        // If edge and shape edge mode are enabled, render edges.
        renderEdge(relVert, shape["edges"])
      }
    }
  }
}


// Rendering Routine.
function updateScreen(){
  clearCanvas()
  rendering(geometry=toRender, renderV=true, renderE=true, renderF=false), 
  drawBorder()
  drawPoint(0, 0, 5, "#FFFFFF") // Clear the crossair's background w/ white.
  drawPoint(0, 0, 5, "#888888") // Draw a grey crossair in the canvas' center.
}


// Give geometry data.
function loadJSON(){
  let geom = 
  [{"Id": 0, "name": "Cube", "mode": "pef", "isRendered": true, "position": [0.0, -5.0, 0.0], "rotation": [34.99999983559887, -45.00000125223908], "points": [{"point": [2.0, 0.0, 0.0], "color": "#000000"}, {"point": [1.0, 0.0, 1.0], "color": "#000000"}, {"point": [-1.0, 1.0, 1.0], "color": "#000000"}, {"point": [-1.0, 1.0, -1.0], "color": "#000000"}, {"point": [-1.0, -1.0, 1.0], "color": "#000000"}, {"point": [-1.0, -1.0, -1.0], "color": "#000000"}, {"point": [1.0, 1.0, 1.0], "color": "#000000"}, {"point": [1.0, 1.0, -1.0], "color": "#000000"}, {"point": [1.0, -1.0, 1.0], "color": "#000000"}, {"point": [1.0, -1.0, -1.0], "color": "#000000"}, {"point": [2.0, 0.0, 1.5], "color": "#000000"}, {"point": [1.0, 0.0, 2.5], "color": "#000000"}], "edges": [{"edge": [3, 7], "color": "#000000"}, {"edge": [6, 7], "color": "#000000"}, {"edge": [4, 5], "color": "#000000"}, {"edge": [8, 9], "color": "#000000"}, {"edge": [2, 3], "color": "#000000"}, {"edge": [4, 8], "color": "#000000"}, {"edge": [1, 8], "color": "#000000"}, {"edge": [5, 9], "color": "#000000"}, {"edge": [2, 6], "color": "#000000"}, {"edge": [0, 1], "color": "#000000"}, {"edge": [0, 6], "color": "#000000"}, {"edge": [7, 9], "color": "#000000"}, {"edge": [2, 4], "color": "#000000"}, {"edge": [1, 6], "color": "#000000"}, {"edge": [3, 5], "color": "#000000"}, {"edge": [0, 7], "color": "#000000"}, {"edge": [0, 9], "color": "#000000"}, {"edge": [0, 8], "color": "#000000"}, {"edge": [10, 11], "color": "#000000"}, {"edge": [1, 11], "color": "#000000"}, {"edge": [0, 10], "color": "#000000"}], "faces": [{"face": [3, 7, 9, 5], "color": "#0000FF"}, {"face": [9, 8, 4, 5], "color": "#0000FF"}, {"face": [6, 2, 4, 8, 1], "color": "#0000FF"}, {"face": [3, 2, 6, 7], "color": "#0000FF"}, {"face": [0, 7, 6], "color": "#0000FF"}, {"face": [0, 8, 9], "color": "#0000FF"}, {"face": [0, 6, 1], "color": "#0000FF"}, {"face": [0, 9, 7], "color": "#0000FF"}, {"face": [8, 0, 1], "color": "#0000FF"}, {"face": [1, 0, 10, 11], "color": "#0000FF"}, {"face": [5, 4, 2, 3], "color": "#0000FF"}], "color": "#000000"}, {"Id": 1, "name": "Suzanne", "mode": "ef", "isRendered": true, "position": [0.0, 0.0, 0.0], "rotation": [0.0, 0.0], "points": [{"point": [0.875, -1.53125, 0.328125], "color": "#000000"}, {"point": [-0.875, -1.53125, 0.328125], "color": "#000000"}, {"point": [1.0, -1.375, 0.1875], "color": "#000000"}, {"point": [-1.0, -1.375, 0.1875], "color": "#000000"}, {"point": [1.09375, -1.15625, 0.109375], "color": "#000000"}, {"point": [-1.09375, -1.15625, 0.109375], "color": "#000000"}, {"point": [0.703125, -1.234375, -0.046875], "color": "#000000"}, {"point": [-0.703125, -1.234375, -0.046875], "color": "#000000"}, {"point": [0.703125, -1.4375, 0.0625], "color": "#000000"}, {"point": [-0.703125, -1.4375, 0.0625], "color": "#000000"}, {"point": [0.703125, -1.5625, 0.265625], "color": "#000000"}, {"point": [-0.703125, -1.5625, 0.265625], "color": "#000000"}, {"point": [0.546875, -1.59375, 0.328125], "color": "#000000"}, {"point": [-0.546875, -1.59375, 0.328125], "color": "#000000"}, {"point": [0.40625, -1.484375, 0.1875], "color": "#000000"}, {"point": [-0.40625, -1.484375, 0.1875], "color": "#000000"}, {"point": [0.3125, -1.296875, 0.109375], "color": "#000000"}, {"point": [-0.3125, -1.296875, 0.109375], "color": "#000000"}, {"point": [0.15625, -1.3125, 0.484375], "color": "#000000"}, {"point": [-0.15625, -1.3125, 0.484375], "color": "#000000"}, {"point": [0.28125, -1.484375, 0.484375], "color": "#000000"}, {"point": [-0.28125, -1.484375, 0.484375], "color": "#000000"}, {"point": [0.484375, -1.59375, 0.484375], "color": "#000000"}, {"point": [-0.484375, -1.59375, 0.484375], "color": "#000000"}, {"point": [0.546875, -1.59375, 0.65625], "color": "#000000"}, {"point": [-0.546875, -1.59375, 0.65625], "color": "#000000"}, {"point": [0.40625, -1.484375, 0.78125], "color": "#000000"}, {"point": [-0.40625, -1.484375, 0.78125], "color": "#000000"}, {"point": [0.3125, -1.296875, 0.875], "color": "#000000"}, {"point": [-0.3125, -1.296875, 0.875], "color": "#000000"}, {"point": [0.703125, -1.234375, 1.03125], "color": "#000000"}, {"point": [-0.703125, -1.234375, 1.03125], "color": "#000000"}, {"point": [0.703125, -1.4375, 0.90625], "color": "#000000"}, {"point": [-0.703125, -1.4375, 0.90625], "color": "#000000"}, {"point": [0.703125, -1.5625, 0.71875], "color": "#000000"}, {"point": [-0.703125, -1.5625, 0.71875], "color": "#000000"}, {"point": [0.875, -1.53125, 0.65625], "color": "#000000"}, {"point": [-0.875, -1.53125, 0.65625], "color": "#000000"}, {"point": [1.0, -1.375, 0.78125], "color": "#000000"}, {"point": [-1.0, -1.375, 0.78125], "color": "#000000"}, {"point": [1.09375, -1.15625, 0.875], "color": "#000000"}, {"point": [-1.09375, -1.15625, 0.875], "color": "#000000"}, {"point": [1.25, -1.125, 0.484375], "color": "#000000"}, {"point": [-1.25, -1.125, 0.484375], "color": "#000000"}, {"point": [1.125, -1.34375, 0.484375], "color": "#000000"}, {"point": [-1.125, -1.34375, 0.484375], "color": "#000000"}, {"point": [0.9375, -1.515625, 0.484375], "color": "#000000"}, {"point": [-0.9375, -1.515625, 0.484375], "color": "#000000"}, {"point": [0.953125, -1.546875, 0.484375], "color": "#000000"}, {"point": [-0.953125, -1.546875, 0.484375], "color": "#000000"}, {"point": [0.890625, -1.5625, 0.671875], "color": "#000000"}, {"point": [-0.890625, -1.5625, 0.671875], "color": "#000000"}, {"point": [0.703125, -1.609375, 0.75], "color": "#000000"}, {"point": [-0.703125, -1.609375, 0.75], "color": "#000000"}, {"point": [0.53125, -1.640625, 0.671875], "color": "#000000"}, {"point": [-0.53125, -1.640625, 0.671875], "color": "#000000"}, {"point": [0.453125, -1.640625, 0.484375], "color": "#000000"}, {"point": [-0.453125, -1.640625, 0.484375], "color": "#000000"}, {"point": [0.53125, -1.640625, 0.3125], "color": "#000000"}, {"point": [-0.53125, -1.640625, 0.3125], "color": "#000000"}, {"point": [0.703125, -1.65625, 0.484375], "color": "#000000"}, {"point": [-0.703125, -1.65625, 0.484375], "color": "#000000"}, {"point": [0.703125, -1.609375, 0.234375], "color": "#000000"}, {"point": [-0.703125, -1.609375, 0.234375], "color": "#000000"}, {"point": [0.890625, -1.5625, 0.3125], "color": "#000000"}, {"point": [-0.890625, -1.5625, 0.3125], "color": "#000000"}, {"point": [0.0, -1.484375, 0.859375], "color": "#000000"}, {"point": [0.0, -1.640625, 0.703125], "color": "#000000"}, {"point": [0.0, -1.46875, -1.359375], "color": "#000000"}, {"point": [0.0, -1.5625, -0.640625], "color": "#000000"}, {"point": [0.0, -1.59375, -0.375], "color": "#000000"}, {"point": [0.0, -1.4375, -1.546875], "color": "#000000"}, {"point": [0.0, -1.203125, 0.8125], "color": "#000000"}, {"point": [0.0, -1.140625, 1.140625], "color": "#000000"}, {"point": [0.0, 1.09375, 1.796875], "color": "#000000"}, {"point": [0.0, 1.703125, 1.125], "color": "#000000"}, {"point": [0.0, 1.65625, 0.140625], "color": "#000000"}, {"point": [0.0, 0.703125, -0.765625], "color": "#000000"}, {"point": [0.40625, -1.125, -0.375], "color": "#000000"}, {"point": [-0.40625, -1.125, -0.375], "color": "#000000"}, {"point": [0.625, -1.140625, -0.875], "color": "#000000"}, {"point": [-0.625, -1.140625, -0.875], "color": "#000000"}, {"point": [0.703125, -1.140625, -1.390625], "color": "#000000"}, {"point": [-0.703125, -1.140625, -1.390625], "color": "#000000"}, {"point": [0.734375, -1.0625, -1.78125], "color": "#000000"}, {"point": [-0.734375, -1.0625, -1.78125], "color": "#000000"}, {"point": [0.65625, -1.046875, -1.890625], "color": "#000000"}, {"point": [-0.65625, -1.046875, -1.890625], "color": "#000000"}, {"point": [0.359375, -1.109375, -1.9375], "color": "#000000"}, {"point": [-0.359375, -1.109375, -1.9375], "color": "#000000"}, {"point": [0.0, -1.15625, -1.96875], "color": "#000000"}, {"point": [0.875, -1.0625, -0.28125], "color": "#000000"}, {"point": [-0.875, -1.0625, -0.28125], "color": "#000000"}, {"point": [1.265625, -1.078125, -0.078125], "color": "#000000"}, {"point": [-1.265625, -1.078125, -0.078125], "color": "#000000"}, {"point": [1.65625, -0.890625, 0.296875], "color": "#000000"}, {"point": [-1.65625, -0.890625, 0.296875], "color": "#000000"}, {"point": [1.71875, -1.1875, 0.859375], "color": "#000000"}, {"point": [-1.71875, -1.1875, 0.859375], "color": "#000000"}, {"point": [1.421875, -1.25, 0.96875], "color": "#000000"}, {"point": [-1.421875, -1.25, 0.96875], "color": "#000000"}, {"point": [0.984375, -1.375, 1.203125], "color": "#000000"}, {"point": [-0.984375, -1.375, 1.203125], "color": "#000000"}, {"point": [0.640625, -1.46875, 1.515625], "color": "#000000"}, {"point": [-0.640625, -1.46875, 1.515625], "color": "#000000"}, {"point": [0.3125, -1.515625, 1.4375], "color": "#000000"}, {"point": [-0.3125, -1.515625, 1.4375], "color": "#000000"}, {"point": [0.125, -1.5, 0.984375], "color": "#000000"}, {"point": [-0.125, -1.5, 0.984375], "color": "#000000"}, {"point": [0.328125, -1.546875, 0.828125], "color": "#000000"}, {"point": [-0.328125, -1.546875, 0.828125], "color": "#000000"}, {"point": [0.25, -1.53125, 0.609375], "color": "#000000"}, {"point": [-0.25, -1.53125, 0.609375], "color": "#000000"}, {"point": [0.40625, -1.484375, 0.1875], "color": "#000000"}, {"point": [-0.40625, -1.484375, 0.1875], "color": "#000000"}, {"point": [0.75, -1.40625, 0.03125], "color": "#000000"}, {"point": [-0.75, -1.40625, 0.03125], "color": "#000000"}, {"point": [0.984375, -1.34375, 0.125], "color": "#000000"}, {"point": [-0.984375, -1.34375, 0.125], "color": "#000000"}, {"point": [1.25, -1.296875, 0.375], "color": "#000000"}, {"point": [-1.25, -1.296875, 0.375], "color": "#000000"}, {"point": [1.28125, -1.296875, 0.59375], "color": "#000000"}, {"point": [-1.28125, -1.296875, 0.59375], "color": "#000000"}, {"point": [1.203125, -1.328125, 0.75], "color": "#000000"}, {"point": [-1.203125, -1.328125, 0.75], "color": "#000000"}, {"point": [0.859375, -1.4375, 0.875], "color": "#000000"}, {"point": [-0.859375, -1.4375, 0.875], "color": "#000000"}, {"point": [0.5, -1.515625, 0.9375], "color": "#000000"}, {"point": [-0.5, -1.515625, 0.9375], "color": "#000000"}, {"point": [0.0, -1.46875, -1.53125], "color": "#000000"}, {"point": [0.21875, -1.46875, -1.4375], "color": "#000000"}, {"point": [-0.21875, -1.46875, -1.4375], "color": "#000000"}, {"point": [0.234375, -1.421875, -1.671875], "color": "#000000"}, {"point": [-0.234375, -1.421875, -1.671875], "color": "#000000"}, {"point": [0.125, -1.390625, -1.765625], "color": "#000000"}, {"point": [-0.125, -1.390625, -1.765625], "color": "#000000"}, {"point": [0.0, -1.375, -1.78125], "color": "#000000"}, {"point": [0.0, -1.5, -0.390625], "color": "#000000"}, {"point": [0.0, -1.484375, -0.28125], "color": "#000000"}, {"point": [0.203125, -1.484375, -0.296875], "color": "#000000"}, {"point": [-0.203125, -1.484375, -0.296875], "color": "#000000"}, {"point": [0.25, -1.5, -0.453125], "color": "#000000"}, {"point": [-0.25, -1.5, -0.453125], "color": "#000000"}, {"point": [0.171875, -1.484375, -0.578125], "color": "#000000"}, {"point": [-0.171875, -1.484375, -0.578125], "color": "#000000"}, {"point": [0.796875, -1.34375, -0.09375], "color": "#000000"}, {"point": [-0.796875, -1.34375, -0.09375], "color": "#000000"}, {"point": [1.234375, -1.25, 0.109375], "color": "#000000"}, {"point": [-1.234375, -1.25, 0.109375], "color": "#000000"}, {"point": [1.453125, -1.203125, 0.40625], "color": "#000000"}, {"point": [-1.453125, -1.203125, 0.40625], "color": "#000000"}, {"point": [1.484375, -1.3125, 0.75], "color": "#000000"}, {"point": [-1.484375, -1.3125, 0.75], "color": "#000000"}, {"point": [1.375, -1.453125, 0.828125], "color": "#000000"}, {"point": [-1.375, -1.453125, 0.828125], "color": "#000000"}, {"point": [0.875, -1.59375, 1.09375], "color": "#000000"}, {"point": [-0.875, -1.59375, 1.09375], "color": "#000000"}, {"point": [0.625, -1.671875, 1.28125], "color": "#000000"}, {"point": [-0.625, -1.671875, 1.28125], "color": "#000000"}, {"point": [0.40625, -1.703125, 1.234375], "color": "#000000"}, {"point": [-0.40625, -1.703125, 1.234375], "color": "#000000"}, {"point": [0.203125, -1.6875, 0.859375], "color": "#000000"}, {"point": [-0.203125, -1.6875, 0.859375], "color": "#000000"}, {"point": [0.25, -1.625, -0.203125], "color": "#000000"}, {"point": [-0.25, -1.625, -0.203125], "color": "#000000"}, {"point": [0.421875, -1.421875, -0.890625], "color": "#000000"}, {"point": [-0.421875, -1.421875, -0.890625], "color": "#000000"}, {"point": [0.5, -1.375, -1.40625], "color": "#000000"}, {"point": [-0.5, -1.375, -1.40625], "color": "#000000"}, {"point": [0.53125, -1.328125, -1.640625], "color": "#000000"}, {"point": [-0.53125, -1.328125, -1.640625], "color": "#000000"}, {"point": [0.46875, -1.265625, -1.828125], "color": "#000000"}, {"point": [-0.46875, -1.265625, -1.828125], "color": "#000000"}, {"point": [0.328125, -1.265625, -1.859375], "color": "#000000"}, {"point": [-0.328125, -1.265625, -1.859375], "color": "#000000"}, {"point": [0.0, -1.28125, -1.890625], "color": "#000000"}, {"point": [0.0, -1.453125, 0.09375], "color": "#000000"}, {"point": [0.0, -1.53125, 0.421875], "color": "#000000"}, {"point": [0.65625, -1.484375, 0.953125], "color": "#000000"}, {"point": [-0.65625, -1.484375, 0.953125], "color": "#000000"}, {"point": [0.328125, -1.5, 0.28125], "color": "#000000"}, {"point": [-0.328125, -1.5, 0.28125], "color": "#000000"}, {"point": [0.265625, -1.515625, 0.421875], "color": "#000000"}, {"point": [-0.265625, -1.515625, 0.421875], "color": "#000000"}, {"point": [0.234375, -1.46875, -1.375], "color": "#000000"}, {"point": [-0.234375, -1.46875, -1.375], "color": "#000000"}, {"point": [0.15625, -1.5, -0.890625], "color": "#000000"}, {"point": [-0.15625, -1.5, -0.890625], "color": "#000000"}, {"point": [0.0, -1.5, -0.890625], "color": "#000000"}, {"point": [0.0, -1.484375, -0.65625], "color": "#000000"}, {"point": [0.1875, -1.5625, -0.546875], "color": "#000000"}, {"point": [-0.1875, -1.5625, -0.546875], "color": "#000000"}, {"point": [0.265625, -1.59375, -0.453125], "color": "#000000"}, {"point": [-0.265625, -1.59375, -0.453125], "color": "#000000"}, {"point": [0.21875, -1.5625, -0.265625], "color": "#000000"}, {"point": [-0.21875, -1.5625, -0.265625], "color": "#000000"}, {"point": [0.078125, -1.5625, -0.25], "color": "#000000"}, {"point": [-0.078125, -1.5625, -0.25], "color": "#000000"}, {"point": [0.0, -1.65625, -0.40625], "color": "#000000"}, {"point": [0.09375, -1.625, -0.296875], "color": "#000000"}, {"point": [-0.09375, -1.625, -0.296875], "color": "#000000"}, {"point": [0.1875, -1.625, -0.3125], "color": "#000000"}, {"point": [-0.1875, -1.625, -0.3125], "color": "#000000"}, {"point": [0.21875, -1.65625, -0.453125], "color": "#000000"}, {"point": [-0.21875, -1.65625, -0.453125], "color": "#000000"}, {"point": [0.15625, -1.609375, -0.5], "color": "#000000"}, {"point": [-0.15625, -1.609375, -0.5], "color": "#000000"}, {"point": [0.0, -1.609375, -0.578125], "color": "#000000"}, {"point": [0.515625, -1.109375, -0.625], "color": "#000000"}, {"point": [-0.515625, -1.109375, -0.625], "color": "#000000"}, {"point": [0.328125, -1.421875, -0.484375], "color": "#000000"}, {"point": [-0.328125, -1.421875, -0.484375], "color": "#000000"}, {"point": [0.359375, -1.421875, -0.625], "color": "#000000"}, {"point": [-0.359375, -1.421875, -0.625], "color": "#000000"}, {"point": [0.46875, -1.109375, -0.5], "color": "#000000"}, {"point": [-0.46875, -1.109375, -0.5], "color": "#000000"}, {"point": [0.0, -1.375, -1.75], "color": "#000000"}, {"point": [0.09375, -1.375, -1.734375], "color": "#000000"}, {"point": [-0.09375, -1.375, -1.734375], "color": "#000000"}, {"point": [0.1875, -1.421875, -1.640625], "color": "#000000"}, {"point": [-0.1875, -1.421875, -1.640625], "color": "#000000"}, {"point": [0.1875, -1.453125, -1.484375], "color": "#000000"}, {"point": [-0.1875, -1.453125, -1.484375], "color": "#000000"}, {"point": [0.0, -1.3125, -1.5625], "color": "#000000"}, {"point": [0.1875, -1.328125, -1.5], "color": "#000000"}, {"point": [-0.1875, -1.328125, -1.5], "color": "#000000"}, {"point": [0.1875, -1.28125, -1.625], "color": "#000000"}, {"point": [-0.1875, -1.28125, -1.625], "color": "#000000"}, {"point": [0.09375, -1.265625, -1.703125], "color": "#000000"}, {"point": [-0.09375, -1.265625, -1.703125], "color": "#000000"}, {"point": [0.0, -1.265625, -1.71875], "color": "#000000"}, {"point": [0.34375, -1.5625, 0.4375], "color": "#000000"}, {"point": [-0.34375, -1.5625, 0.4375], "color": "#000000"}, {"point": [0.375, -1.546875, 0.3125], "color": "#000000"}, {"point": [-0.375, -1.546875, 0.3125], "color": "#000000"}, {"point": [0.671875, -1.515625, 0.859375], "color": "#000000"}, {"point": [-0.671875, -1.515625, 0.859375], "color": "#000000"}, {"point": [0.546875, -1.546875, 0.84375], "color": "#000000"}, {"point": [-0.546875, -1.546875, 0.84375], "color": "#000000"}, {"point": [0.84375, -1.546875, 0.796875], "color": "#000000"}, {"point": [-0.84375, -1.546875, 0.796875], "color": "#000000"}, {"point": [1.125, -1.390625, 0.703125], "color": "#000000"}, {"point": [-1.125, -1.390625, 0.703125], "color": "#000000"}, {"point": [1.171875, -1.375, 0.578125], "color": "#000000"}, {"point": [-1.171875, -1.375, 0.578125], "color": "#000000"}, {"point": [1.15625, -1.359375, 0.390625], "color": "#000000"}, {"point": [-1.15625, -1.359375, 0.390625], "color": "#000000"}, {"point": [0.953125, -1.4375, 0.203125], "color": "#000000"}, {"point": [-0.953125, -1.4375, 0.203125], "color": "#000000"}, {"point": [0.75, -1.484375, 0.125], "color": "#000000"}, {"point": [-0.75, -1.484375, 0.125], "color": "#000000"}, {"point": [0.453125, -1.5625, 0.21875], "color": "#000000"}, {"point": [-0.453125, -1.5625, 0.21875], "color": "#000000"}, {"point": [0.359375, -1.5625, 0.59375], "color": "#000000"}, {"point": [-0.359375, -1.5625, 0.59375], "color": "#000000"}, {"point": [0.421875, -1.5625, 0.75], "color": "#000000"}, {"point": [-0.421875, -1.5625, 0.75], "color": "#000000"}, {"point": [0.46875, -1.515625, 0.71875], "color": "#000000"}, {"point": [-0.46875, -1.515625, 0.71875], "color": "#000000"}, {"point": [0.390625, -1.515625, 0.59375], "color": "#000000"}, {"point": [-0.390625, -1.515625, 0.59375], "color": "#000000"}, {"point": [0.484375, -1.515625, 0.25], "color": "#000000"}, {"point": [-0.484375, -1.515625, 0.25], "color": "#000000"}, {"point": [0.75, -1.453125, 0.171875], "color": "#000000"}, {"point": [-0.75, -1.453125, 0.171875], "color": "#000000"}, {"point": [0.921875, -1.40625, 0.234375], "color": "#000000"}, {"point": [-0.921875, -1.40625, 0.234375], "color": "#000000"}, {"point": [1.09375, -1.34375, 0.421875], "color": "#000000"}, {"point": [-1.09375, -1.34375, 0.421875], "color": "#000000"}, {"point": [1.109375, -1.34375, 0.5625], "color": "#000000"}, {"point": [-1.109375, -1.34375, 0.5625], "color": "#000000"}, {"point": [1.0625, -1.359375, 0.671875], "color": "#000000"}, {"point": [-1.0625, -1.359375, 0.671875], "color": "#000000"}, {"point": [0.828125, -1.5, 0.78125], "color": "#000000"}, {"point": [-0.828125, -1.5, 0.78125], "color": "#000000"}, {"point": [0.5625, -1.53125, 0.796875], "color": "#000000"}, {"point": [-0.5625, -1.53125, 0.796875], "color": "#000000"}, {"point": [0.671875, -1.5, 0.8125], "color": "#000000"}, {"point": [-0.671875, -1.5, 0.8125], "color": "#000000"}, {"point": [0.40625, -1.5, 0.34375], "color": "#000000"}, {"point": [-0.40625, -1.5, 0.34375], "color": "#000000"}, {"point": [0.390625, -1.5, 0.453125], "color": "#000000"}, {"point": [-0.390625, -1.5, 0.453125], "color": "#000000"}, {"point": [0.21875, -1.21875, 0.921875], "color": "#000000"}, {"point": [-0.21875, -1.21875, 0.921875], "color": "#000000"}, {"point": [0.390625, -1.234375, 1.328125], "color": "#000000"}, {"point": [-0.390625, -1.234375, 1.328125], "color": "#000000"}, {"point": [0.671875, -1.1875, 1.375], "color": "#000000"}, {"point": [-0.671875, -1.1875, 1.375], "color": "#000000"}, {"point": [0.96875, -1.109375, 1.109375], "color": "#000000"}, {"point": [-0.96875, -1.109375, 1.109375], "color": "#000000"}, {"point": [1.359375, -0.984375, 0.90625], "color": "#000000"}, {"point": [-1.359375, -0.984375, 0.90625], "color": "#000000"}, {"point": [1.59375, -0.921875, 0.8125], "color": "#000000"}, {"point": [-1.59375, -0.921875, 0.8125], "color": "#000000"}, {"point": [1.546875, -0.75, 0.328125], "color": "#000000"}, {"point": [-1.546875, -0.75, 0.328125], "color": "#000000"}, {"point": [1.203125, -0.828125, 0.0], "color": "#000000"}, {"point": [-1.203125, -0.828125, 0.0], "color": "#000000"}, {"point": [0.875, -0.9375, -0.1875], "color": "#000000"}, {"point": [-0.875, -0.9375, -0.1875], "color": "#000000"}, {"point": [0.0, -0.578125, 1.796875], "color": "#000000"}, {"point": [0.0, 0.15625, 1.96875], "color": "#000000"}, {"point": [0.0, 1.34375, -0.390625], "color": "#000000"}, {"point": [0.0, -0.375, -0.921875], "color": "#000000"}, {"point": [0.0, -0.921875, -1.953125], "color": "#000000"}, {"point": [0.0, -0.6875, -1.609375], "color": "#000000"}, {"point": [0.0, -0.640625, -1.140625], "color": "#000000"}, {"point": [0.0, -0.5625, -0.96875], "color": "#000000"}, {"point": [1.703125, -0.109375, 0.46875], "color": "#000000"}, {"point": [-1.703125, -0.109375, 0.46875], "color": "#000000"}, {"point": [1.71875, 0.09375, 0.640625], "color": "#000000"}, {"point": [-1.71875, 0.09375, 0.640625], "color": "#000000"}, {"point": [1.546875, 0.875, 0.53125], "color": "#000000"}, {"point": [-1.546875, 0.875, 0.53125], "color": "#000000"}, {"point": [0.921875, 1.40625, 0.875], "color": "#000000"}, {"point": [-0.921875, 1.40625, 0.875], "color": "#000000"}, {"point": [1.46875, -0.140625, -0.09375], "color": "#000000"}, {"point": [-1.46875, -0.140625, -0.09375], "color": "#000000"}, {"point": [1.1875, 0.328125, -0.25], "color": "#000000"}, {"point": [-1.1875, 0.328125, -0.25], "color": "#000000"}, {"point": [1.28125, 0.859375, -0.015625], "color": "#000000"}, {"point": [-1.28125, 0.859375, -0.015625], "color": "#000000"}, {"point": [0.671875, 1.328125, 0.109375], "color": "#000000"}, {"point": [-0.671875, 1.328125, 0.109375], "color": "#000000"}, {"point": [0.46875, -0.8125, -0.703125], "color": "#000000"}, {"point": [-0.46875, -0.8125, -0.703125], "color": "#000000"}, {"point": [0.359375, -0.515625, -0.828125], "color": "#000000"}, {"point": [-0.359375, -0.515625, -0.828125], "color": "#000000"}, {"point": [0.578125, -0.765625, -1.421875], "color": "#000000"}, {"point": [-0.578125, -0.765625, -1.421875], "color": "#000000"}, {"point": [0.5, -0.78125, -1.0], "color": "#000000"}, {"point": [-0.5, -0.78125, -1.0], "color": "#000000"}, {"point": [0.65625, -0.796875, -1.828125], "color": "#000000"}, {"point": [-0.65625, -0.796875, -1.828125], "color": "#000000"}, {"point": [0.28125, -0.734375, -1.515625], "color": "#000000"}, {"point": [-0.28125, -0.734375, -1.515625], "color": "#000000"}, {"point": [0.25, -0.71875, -1.078125], "color": "#000000"}, {"point": [-0.25, -0.71875, -1.078125], "color": "#000000"}, {"point": [0.328125, -0.875, -1.890625], "color": "#000000"}, {"point": [-0.328125, -0.875, -1.890625], "color": "#000000"}, {"point": [0.4375, -0.859375, -0.5625], "color": "#000000"}, {"point": [-0.4375, -0.859375, -0.5625], "color": "#000000"}, {"point": [0.421875, -0.9375, -0.453125], "color": "#000000"}, {"point": [-0.421875, -0.9375, -0.453125], "color": "#000000"}, {"point": [0.40625, -1.0, -0.34375], "color": "#000000"}, {"point": [-0.40625, -1.0, -0.34375], "color": "#000000"}, {"point": [0.421875, -0.328125, -0.78125], "color": "#000000"}, {"point": [-0.421875, -0.328125, -0.78125], "color": "#000000"}, {"point": [0.59375, 0.53125, -0.625], "color": "#FF0000"}, {"point": [-0.59375, 0.53125, -0.625], "color": "#000000"}, {"point": [0.6875, 1.078125, -0.296875], "color": "#000000"}, {"point": [-0.6875, 1.078125, -0.296875], "color": "#000000"}, {"point": [0.90625, 0.765625, 1.734375], "color": "#000000"}, {"point": [-0.90625, 0.765625, 1.734375], "color": "#000000"}, {"point": [0.90625, 0.140625, 1.859375], "color": "#000000"}, {"point": [-0.90625, 0.140625, 1.859375], "color": "#000000"}, {"point": [0.90625, -0.46875, 1.703125], "color": "#000000"}, {"point": [-0.90625, -0.46875, 1.703125], "color": "#000000"}, {"point": [0.921875, -0.859375, 1.046875], "color": "#000000"}, {"point": [-0.921875, -0.859375, 1.046875], "color": "#000000"}, {"point": [1.453125, -0.671875, 0.8125], "color": "#000000"}, {"point": [-1.453125, -0.671875, 0.8125], "color": "#000000"}, {"point": [1.265625, -0.5625, 0.90625], "color": "#000000"}, {"point": [-1.265625, -0.5625, 0.90625], "color": "#000000"}, {"point": [1.28125, -0.109375, 1.40625], "color": "#000000"}, {"point": [-1.28125, -0.109375, 1.40625], "color": "#000000"}, {"point": [1.59375, -0.25, 1.125], "color": "#000000"}, {"point": [-1.59375, -0.25, 1.125], "color": "#000000"}, {"point": [1.59375, 0.234375, 1.234375], "color": "#000000"}, {"point": [-1.59375, 0.234375, 1.234375], "color": "#000000"}, {"point": [1.28125, 0.390625, 1.5], "color": "#000000"}, {"point": [-1.28125, 0.390625, 1.5], "color": "#000000"}, {"point": [1.28125, 0.890625, 1.359375], "color": "#000000"}, {"point": [-1.28125, 0.890625, 1.359375], "color": "#000000"}, {"point": [1.59375, 0.71875, 1.078125], "color": "#000000"}, {"point": [-1.59375, 0.71875, 1.078125], "color": "#000000"}, {"point": [1.234375, 1.171875, 0.65625], "color": "#000000"}, {"point": [-1.234375, 1.171875, 0.65625], "color": "#000000"}, {"point": [0.96875, 1.09375, 0.046875], "color": "#000000"}, {"point": [-0.96875, 1.09375, 0.046875], "color": "#000000"}, {"point": [1.640625, 0.40625, 0.65625], "color": "#000000"}, {"point": [-1.640625, 0.40625, 0.65625], "color": "#000000"}, {"point": [0.8125, -0.296875, -0.34375], "color": "#000000"}, {"point": [-0.8125, -0.296875, -0.34375], "color": "#000000"}, {"point": [0.859375, 0.421875, -0.390625], "color": "#000000"}, {"point": [-0.859375, 0.421875, -0.390625], "color": "#000000"}, {"point": [1.78125, 0.46875, 0.8125], "color": "#000000"}, {"point": [-1.78125, 0.46875, 0.8125], "color": "#000000"}, {"point": [1.546875, 0.25, -0.28125], "color": "#000000"}, {"point": [-1.546875, 0.25, -0.28125], "color": "#000000"}, {"point": [2.078125, 0.65625, -0.203125], "color": "#000000"}, {"point": [-2.078125, 0.65625, -0.203125], "color": "#000000"}, {"point": [2.5625, 0.859375, 0.109375], "color": "#000000"}, {"point": [-2.5625, 0.859375, 0.109375], "color": "#000000"}, {"point": [2.703125, 0.84375, 0.640625], "color": "#000000"}, {"point": [-2.703125, 0.84375, 0.640625], "color": "#000000"}, {"point": [2.46875, 0.84375, 1.015625], "color": "#000000"}, {"point": [-2.46875, 0.84375, 1.015625], "color": "#000000"}, {"point": [2.046875, 0.625, 0.953125], "color": "#000000"}, {"point": [-2.046875, 0.625, 0.953125], "color": "#000000"}, {"point": [2.03125, 0.578125, 0.828125], "color": "#000000"}, {"point": [-2.03125, 0.578125, 0.828125], "color": "#000000"}, {"point": [2.375, 0.78125, 0.875], "color": "#000000"}, {"point": [-2.375, 0.78125, 0.875], "color": "#000000"}, {"point": [2.53125, 0.8125, 0.578125], "color": "#000000"}, {"point": [-2.53125, 0.8125, 0.578125], "color": "#000000"}, {"point": [2.421875, 0.8125, 0.15625], "color": "#000000"}, {"point": [-2.421875, 0.8125, 0.15625], "color": "#000000"}, {"point": [2.0625, 0.609375, -0.078125], "color": "#000000"}, {"point": [-2.0625, 0.609375, -0.078125], "color": "#000000"}, {"point": [1.65625, 0.265625, -0.140625], "color": "#000000"}, {"point": [-1.65625, 0.265625, -0.140625], "color": "#000000"}, {"point": [1.84375, 0.4375, 0.71875], "color": "#000000"}, {"point": [-1.84375, 0.4375, 0.71875], "color": "#000000"}, {"point": [1.890625, 0.578125, 0.609375], "color": "#000000"}, {"point": [-1.890625, 0.578125, 0.609375], "color": "#000000"}, {"point": [1.765625, 0.421875, -0.046875], "color": "#000000"}, {"point": [-1.765625, 0.421875, -0.046875], "color": "#000000"}, {"point": [2.078125, 0.734375, 0.0], "color": "#000000"}, {"point": [-2.078125, 0.734375, 0.0], "color": "#000000"}, {"point": [2.375, 0.890625, 0.1875], "color": "#000000"}, {"point": [-2.375, 0.890625, 0.1875], "color": "#000000"}, {"point": [2.46875, 0.890625, 0.5], "color": "#000000"}, {"point": [-2.46875, 0.890625, 0.5], "color": "#000000"}, {"point": [2.34375, 0.875, 0.71875], "color": "#000000"}, {"point": [-2.34375, 0.875, 0.71875], "color": "#000000"}, {"point": [2.046875, 0.71875, 0.6875], "color": "#000000"}, {"point": [-2.046875, 0.71875, 0.6875], "color": "#000000"}, {"point": [1.6875, 0.421875, 0.578125], "color": "#000000"}, {"point": [-1.6875, 0.421875, 0.578125], "color": "#000000"}, {"point": [1.671875, 0.546875, 0.34375], "color": "#000000"}, {"point": [-1.671875, 0.546875, 0.34375], "color": "#000000"}, {"point": [1.515625, 0.546875, 0.1875], "color": "#000000"}, {"point": [-1.515625, 0.546875, 0.1875], "color": "#000000"}, {"point": [1.640625, 0.546875, 0.171875], "color": "#000000"}, {"point": [-1.640625, 0.546875, 0.171875], "color": "#000000"}, {"point": [1.6875, 0.546875, 0.03125], "color": "#000000"}, {"point": [-1.6875, 0.546875, 0.03125], "color": "#000000"}, {"point": [1.625, 0.546875, -0.03125], "color": "#000000"}, {"point": [-1.625, 0.546875, -0.03125], "color": "#000000"}, {"point": [1.453125, 0.140625, 0.0], "color": "#000000"}, {"point": [-1.453125, 0.140625, 0.0], "color": "#000000"}, {"point": [1.4375, 0.34375, -0.046875], "color": "#000000"}, {"point": [-1.4375, 0.34375, -0.046875], "color": "#000000"}, {"point": [1.4375, 0.375, 0.078125], "color": "#000000"}, {"point": [-1.4375, 0.375, 0.078125], "color": "#000000"}, {"point": [1.59375, 0.421875, 0.40625], "color": "#000000"}, {"point": [-1.59375, 0.421875, 0.40625], "color": "#000000"}, {"point": [1.78125, 0.53125, 0.484375], "color": "#000000"}, {"point": [-1.78125, 0.53125, 0.484375], "color": "#000000"}, {"point": [1.78125, 0.640625, 0.46875], "color": "#000000"}, {"point": [-1.78125, 0.640625, 0.46875], "color": "#000000"}, {"point": [1.625, 0.640625, -0.03125], "color": "#000000"}, {"point": [-1.625, 0.640625, -0.03125], "color": "#000000"}, {"point": [1.703125, 0.640625, 0.03125], "color": "#000000"}, {"point": [-1.703125, 0.640625, 0.03125], "color": "#000000"}, {"point": [1.65625, 0.640625, 0.15625], "color": "#000000"}, {"point": [-1.65625, 0.640625, 0.15625], "color": "#000000"}, {"point": [1.53125, 0.640625, 0.1875], "color": "#000000"}, {"point": [-1.53125, 0.640625, 0.1875], "color": "#000000"}, {"point": [1.6875, 0.640625, 0.34375], "color": "#000000"}, {"point": [-1.6875, 0.640625, 0.34375], "color": "#000000"}, {"point": [2.078125, 0.828125, 0.65625], "color": "#000000"}, {"point": [-2.078125, 0.828125, 0.65625], "color": "#000000"}, {"point": [2.375, 0.96875, 0.6875], "color": "#000000"}, {"point": [-2.375, 0.96875, 0.6875], "color": "#000000"}, {"point": [2.515625, 0.984375, 0.484375], "color": "#000000"}, {"point": [-2.515625, 0.984375, 0.484375], "color": "#000000"}, {"point": [2.421875, 0.96875, 0.171875], "color": "#000000"}, {"point": [-2.421875, 0.96875, 0.171875], "color": "#000000"}, {"point": [2.09375, 0.84375, 0.0], "color": "#000000"}, {"point": [-2.09375, 0.84375, 0.0], "color": "#000000"}, {"point": [1.765625, 0.53125, -0.03125], "color": "#000000"}, {"point": [-1.765625, 0.53125, -0.03125], "color": "#000000"}, {"point": [1.90625, 0.6875, 0.578125], "color": "#000000"}, {"point": [-1.90625, 0.6875, 0.578125], "color": "#000000"}, {"point": [1.78125, 0.65625, 0.21875], "color": "#000000"}, {"point": [-1.78125, 0.65625, 0.21875], "color": "#000000"}, {"point": [1.875, 0.671875, 0.125], "color": "#000000"}, {"point": [-1.875, 0.671875, 0.125], "color": "#000000"}, {"point": [2.0, 0.734375, 0.25], "color": "#000000"}, {"point": [-2.0, 0.734375, 0.25], "color": "#000000"}, {"point": [1.921875, 0.703125, 0.34375], "color": "#000000"}, {"point": [-1.921875, 0.703125, 0.34375], "color": "#000000"}, {"point": [2.03125, 0.75, 0.46875], "color": "#000000"}, {"point": [-2.03125, 0.75, 0.46875], "color": "#000000"}, {"point": [2.109375, 0.765625, 0.375], "color": "#000000"}, {"point": [-2.109375, 0.765625, 0.375], "color": "#000000"}, {"point": [2.21875, 0.78125, 0.421875], "color": "#000000"}, {"point": [-2.21875, 0.78125, 0.421875], "color": "#000000"}, {"point": [2.171875, 0.78125, 0.546875], "color": "#000000"}, {"point": [-2.171875, 0.78125, 0.546875], "color": "#000000"}, {"point": [2.046875, 0.96875, 0.875], "color": "#000000"}, {"point": [-2.046875, 0.96875, 0.875], "color": "#000000"}, {"point": [2.5, 1.09375, 0.9375], "color": "#000000"}, {"point": [-2.5, 1.09375, 0.9375], "color": "#000000"}, {"point": [2.734375, 1.0, 0.59375], "color": "#000000"}, {"point": [-2.734375, 1.0, 0.59375], "color": "#000000"}, {"point": [2.625, 1.0625, 0.109375], "color": "#000000"}, {"point": [-2.625, 1.0625, 0.109375], "color": "#000000"}, {"point": [2.078125, 0.984375, -0.171875], "color": "#000000"}, {"point": [-2.078125, 0.984375, -0.171875], "color": "#000000"}, {"point": [1.578125, 0.65625, -0.25], "color": "#000000"}, {"point": [-1.578125, 0.65625, -0.25], "color": "#000000"}, {"point": [1.71875, 0.765625, 0.765625], "color": "#000000"}, {"point": [-1.71875, 0.765625, 0.765625], "color": "#000000"}], "edges": [{"edge": [44, 46], "color": "#000000"}, {"edge": [0, 46], "color": "#000000"}, {"edge": [0, 2], "color": "#000000"}, {"edge": [2, 44], "color": "#000000"}, {"edge": [3, 45], "color": "#000000"}, {"edge": [1, 3], "color": "#000000"}, {"edge": [1, 47], "color": "#000000"}, {"edge": [45, 47], "color": "#000000"}, {"edge": [42, 44], "color": "#000000"}, {"edge": [2, 4], "color": "#000000"}, {"edge": [4, 42], "color": "#000000"}, {"edge": [5, 43], "color": "#000000"}, {"edge": [3, 5], "color": "#000000"}, {"edge": [43, 45], "color": "#000000"}, {"edge": [2, 8], "color": "#000000"}, {"edge": [6, 8], "color": "#000000"}, {"edge": [4, 6], "color": "#000000"}, {"edge": [5, 7], "color": "#000000"}, {"edge": [7, 9], "color": "#000000"}, {"edge": [3, 9], "color": "#000000"}, {"edge": [0, 10], "color": "#000000"}, {"edge": [8, 10], "color": "#000000"}, {"edge": [9, 11], "color": "#000000"}, {"edge": [1, 11], "color": "#000000"}, {"edge": [10, 12], "color": "#000000"}, {"edge": [12, 14], "color": "#000000"}, {"edge": [8, 14], "color": "#000000"}, {"edge": [9, 15], "color": "#000000"}, {"edge": [13, 15], "color": "#000000"}, {"edge": [11, 13], "color": "#000000"}, {"edge": [14, 16], "color": "#000000"}, {"edge": [6, 16], "color": "#000000"}, {"edge": [7, 17], "color": "#000000"}, {"edge": [15, 17], "color": "#000000"}, {"edge": [14, 20], "color": "#000000"}, {"edge": [18, 20], "color": "#000000"}, {"edge": [16, 18], "color": "#000000"}, {"edge": [17, 19], "color": "#000000"}, {"edge": [19, 21], "color": "#000000"}, {"edge": [15, 21], "color": "#000000"}, {"edge": [12, 22], "color": "#000000"}, {"edge": [20, 22], "color": "#000000"}, {"edge": [21, 23], "color": "#000000"}, {"edge": [13, 23], "color": "#000000"}, {"edge": [22, 24], "color": "#000000"}, {"edge": [24, 26], "color": "#000000"}, {"edge": [20, 26], "color": "#000000"}, {"edge": [21, 27], "color": "#000000"}, {"edge": [25, 27], "color": "#000000"}, {"edge": [23, 25], "color": "#000000"}, {"edge": [26, 28], "color": "#000000"}, {"edge": [18, 28], "color": "#000000"}, {"edge": [19, 29], "color": "#000000"}, {"edge": [27, 29], "color": "#000000"}, {"edge": [26, 32], "color": "#000000"}, {"edge": [30, 32], "color": "#000000"}, {"edge": [28, 30], "color": "#000000"}, {"edge": [29, 31], "color": "#000000"}, {"edge": [31, 33], "color": "#000000"}, {"edge": [27, 33], "color": "#000000"}, {"edge": [24, 34], "color": "#000000"}, {"edge": [32, 34], "color": "#000000"}, {"edge": [33, 35], "color": "#000000"}, {"edge": [25, 35], "color": "#000000"}, {"edge": [34, 36], "color": "#000000"}, {"edge": [36, 38], "color": "#000000"}, {"edge": [32, 38], "color": "#000000"}, {"edge": [33, 39], "color": "#000000"}, {"edge": [37, 39], "color": "#000000"}, {"edge": [35, 37], "color": "#000000"}, {"edge": [38, 40], "color": "#000000"}, {"edge": [30, 40], "color": "#000000"}, {"edge": [31, 41], "color": "#000000"}, {"edge": [39, 41], "color": "#000000"}, {"edge": [38, 44], "color": "#000000"}, {"edge": [40, 42], "color": "#000000"}, {"edge": [41, 43], "color": "#000000"}, {"edge": [39, 45], "color": "#000000"}, {"edge": [36, 46], "color": "#000000"}, {"edge": [37, 47], "color": "#000000"}, {"edge": [46, 48], "color": "#000000"}, {"edge": [36, 50], "color": "#000000"}, {"edge": [48, 50], "color": "#000000"}, {"edge": [49, 51], "color": "#000000"}, {"edge": [37, 51], "color": "#000000"}, {"edge": [47, 49], "color": "#000000"}, {"edge": [34, 52], "color": "#000000"}, {"edge": [50, 52], "color": "#000000"}, {"edge": [51, 53], "color": "#000000"}, {"edge": [35, 53], "color": "#000000"}, {"edge": [24, 54], "color": "#000000"}, {"edge": [52, 54], "color": "#000000"}, {"edge": [53, 55], "color": "#000000"}, {"edge": [25, 55], "color": "#000000"}, {"edge": [22, 56], "color": "#000000"}, {"edge": [54, 56], "color": "#000000"}, {"edge": [55, 57], "color": "#000000"}, {"edge": [23, 57], "color": "#000000"}, {"edge": [12, 58], "color": "#000000"}, {"edge": [56, 58], "color": "#000000"}, {"edge": [57, 59], "color": "#000000"}, {"edge": [13, 59], "color": "#000000"}, {"edge": [10, 62], "color": "#000000"}, {"edge": [58, 62], "color": "#000000"}, {"edge": [59, 63], "color": "#000000"}, {"edge": [11, 63], "color": "#000000"}, {"edge": [0, 64], "color": "#000000"}, {"edge": [62, 64], "color": "#000000"}, {"edge": [63, 65], "color": "#000000"}, {"edge": [1, 65], "color": "#000000"}, {"edge": [48, 64], "color": "#000000"}, {"edge": [49, 65], "color": "#000000"}, {"edge": [48, 60], "color": "#000000"}, {"edge": [60, 64], "color": "#000000"}, {"edge": [49, 61], "color": "#000000"}, {"edge": [61, 65], "color": "#000000"}, {"edge": [60, 62], "color": "#000000"}, {"edge": [61, 63], "color": "#000000"}, {"edge": [58, 60], "color": "#000000"}, {"edge": [59, 61], "color": "#000000"}, {"edge": [56, 60], "color": "#000000"}, {"edge": [57, 61], "color": "#000000"}, {"edge": [54, 60], "color": "#000000"}, {"edge": [55, 61], "color": "#000000"}, {"edge": [52, 60], "color": "#000000"}, {"edge": [53, 61], "color": "#000000"}, {"edge": [50, 60], "color": "#000000"}, {"edge": [51, 61], "color": "#000000"}, {"edge": [88, 90], "color": "#000000"}, {"edge": [88, 173], "color": "#000000"}, {"edge": [173, 175], "color": "#000000"}, {"edge": [90, 175], "color": "#000000"}, {"edge": [174, 175], "color": "#000000"}, {"edge": [89, 174], "color": "#000000"}, {"edge": [89, 90], "color": "#000000"}, {"edge": [86, 88], "color": "#000000"}, {"edge": [86, 171], "color": "#000000"}, {"edge": [171, 173], "color": "#000000"}, {"edge": [172, 174], "color": "#000000"}, {"edge": [87, 172], "color": "#000000"}, {"edge": [87, 89], "color": "#000000"}, {"edge": [84, 86], "color": "#000000"}, {"edge": [84, 169], "color": "#000000"}, {"edge": [169, 171], "color": "#000000"}, {"edge": [170, 172], "color": "#000000"}, {"edge": [85, 170], "color": "#000000"}, {"edge": [85, 87], "color": "#000000"}, {"edge": [82, 84], "color": "#000000"}, {"edge": [82, 167], "color": "#000000"}, {"edge": [167, 169], "color": "#000000"}, {"edge": [168, 170], "color": "#000000"}, {"edge": [83, 168], "color": "#000000"}, {"edge": [83, 85], "color": "#000000"}, {"edge": [80, 82], "color": "#000000"}, {"edge": [80, 165], "color": "#000000"}, {"edge": [165, 167], "color": "#000000"}, {"edge": [166, 168], "color": "#000000"}, {"edge": [81, 166], "color": "#000000"}, {"edge": [81, 83], "color": "#000000"}, {"edge": [78, 163], "color": "#000000"}, {"edge": [78, 91], "color": "#000000"}, {"edge": [91, 145], "color": "#000000"}, {"edge": [145, 163], "color": "#000000"}, {"edge": [146, 164], "color": "#000000"}, {"edge": [92, 146], "color": "#000000"}, {"edge": [79, 92], "color": "#000000"}, {"edge": [79, 164], "color": "#000000"}, {"edge": [91, 93], "color": "#000000"}, {"edge": [93, 147], "color": "#000000"}, {"edge": [145, 147], "color": "#000000"}, {"edge": [146, 148], "color": "#000000"}, {"edge": [94, 148], "color": "#000000"}, {"edge": [92, 94], "color": "#000000"}, {"edge": [93, 95], "color": "#000000"}, {"edge": [95, 149], "color": "#000000"}, {"edge": [147, 149], "color": "#000000"}, {"edge": [148, 150], "color": "#000000"}, {"edge": [96, 150], "color": "#000000"}, {"edge": [94, 96], "color": "#000000"}, {"edge": [95, 97], "color": "#000000"}, {"edge": [97, 151], "color": "#000000"}, {"edge": [149, 151], "color": "#000000"}, {"edge": [150, 152], "color": "#000000"}, {"edge": [98, 152], "color": "#000000"}, {"edge": [96, 98], "color": "#000000"}, {"edge": [97, 99], "color": "#000000"}, {"edge": [99, 153], "color": "#000000"}, {"edge": [151, 153], "color": "#000000"}, {"edge": [152, 154], "color": "#000000"}, {"edge": [100, 154], "color": "#000000"}, {"edge": [98, 100], "color": "#000000"}, {"edge": [99, 101], "color": "#000000"}, {"edge": [101, 155], "color": "#000000"}, {"edge": [153, 155], "color": "#000000"}, {"edge": [154, 156], "color": "#000000"}, {"edge": [102, 156], "color": "#000000"}, {"edge": [100, 102], "color": "#000000"}, {"edge": [101, 103], "color": "#000000"}, {"edge": [103, 157], "color": "#000000"}, {"edge": [155, 157], "color": "#000000"}, {"edge": [156, 158], "color": "#000000"}, {"edge": [104, 158], "color": "#000000"}, {"edge": [102, 104], "color": "#000000"}, {"edge": [103, 105], "color": "#000000"}, {"edge": [105, 159], "color": "#000000"}, {"edge": [157, 159], "color": "#000000"}, {"edge": [158, 160], "color": "#000000"}, {"edge": [106, 160], "color": "#000000"}, {"edge": [104, 106], "color": "#000000"}, {"edge": [105, 107], "color": "#000000"}, {"edge": [107, 161], "color": "#000000"}, {"edge": [159, 161], "color": "#000000"}, {"edge": [160, 162], "color": "#000000"}, {"edge": [108, 162], "color": "#000000"}, {"edge": [106, 108], "color": "#000000"}, {"edge": [66, 107], "color": "#000000"}, {"edge": [66, 67], "color": "#000000"}, {"edge": [67, 161], "color": "#000000"}, {"edge": [67, 162], "color": "#000000"}, {"edge": [66, 108], "color": "#000000"}, {"edge": [109, 161], "color": "#000000"}, {"edge": [109, 127], "color": "#000000"}, {"edge": [127, 159], "color": "#000000"}, {"edge": [128, 160], "color": "#000000"}, {"edge": [110, 128], "color": "#000000"}, {"edge": [110, 162], "color": "#000000"}, {"edge": [127, 178], "color": "#000000"}, {"edge": [157, 178], "color": "#000000"}, {"edge": [158, 179], "color": "#000000"}, {"edge": [128, 179], "color": "#000000"}, {"edge": [125, 178], "color": "#000000"}, {"edge": [125, 155], "color": "#000000"}, {"edge": [126, 156], "color": "#000000"}, {"edge": [126, 179], "color": "#000000"}, {"edge": [123, 125], "color": "#000000"}, {"edge": [123, 153], "color": "#000000"}, {"edge": [124, 154], "color": "#000000"}, {"edge": [124, 126], "color": "#000000"}, {"edge": [121, 123], "color": "#000000"}, {"edge": [121, 151], "color": "#000000"}, {"edge": [122, 152], "color": "#000000"}, {"edge": [122, 124], "color": "#000000"}, {"edge": [119, 121], "color": "#000000"}, {"edge": [119, 149], "color": "#000000"}, {"edge": [120, 150], "color": "#000000"}, {"edge": [120, 122], "color": "#000000"}, {"edge": [117, 119], "color": "#000000"}, {"edge": [117, 147], "color": "#000000"}, {"edge": [118, 148], "color": "#000000"}, {"edge": [118, 120], "color": "#000000"}, {"edge": [115, 117], "color": "#000000"}, {"edge": [115, 145], "color": "#000000"}, {"edge": [116, 146], "color": "#000000"}, {"edge": [116, 118], "color": "#000000"}, {"edge": [113, 115], "color": "#000000"}, {"edge": [113, 163], "color": "#000000"}, {"edge": [114, 164], "color": "#000000"}, {"edge": [114, 116], "color": "#000000"}, {"edge": [113, 180], "color": "#000000"}, {"edge": [176, 180], "color": "#000000"}, {"edge": [163, 176], "color": "#000000"}, {"edge": [164, 176], "color": "#000000"}, {"edge": [176, 181], "color": "#000000"}, {"edge": [114, 181], "color": "#000000"}, {"edge": [109, 111], "color": "#000000"}, {"edge": [67, 111], "color": "#000000"}, {"edge": [67, 112], "color": "#000000"}, {"edge": [110, 112], "color": "#000000"}, {"edge": [111, 182], "color": "#000000"}, {"edge": [67, 177], "color": "#000000"}, {"edge": [177, 182], "color": "#000000"}, {"edge": [177, 183], "color": "#000000"}, {"edge": [112, 183], "color": "#000000"}, {"edge": [176, 177], "color": "#000000"}, {"edge": [180, 182], "color": "#000000"}, {"edge": [181, 183], "color": "#000000"}, {"edge": [134, 173], "color": "#000000"}, {"edge": [134, 136], "color": "#000000"}, {"edge": [136, 175], "color": "#000000"}, {"edge": [135, 136], "color": "#000000"}, {"edge": [135, 174], "color": "#000000"}, {"edge": [132, 171], "color": "#000000"}, {"edge": [132, 134], "color": "#000000"}, {"edge": [133, 135], "color": "#000000"}, {"edge": [133, 172], "color": "#000000"}, {"edge": [130, 169], "color": "#000000"}, {"edge": [130, 132], "color": "#000000"}, {"edge": [131, 133], "color": "#000000"}, {"edge": [131, 170], "color": "#000000"}, {"edge": [165, 186], "color": "#000000"}, {"edge": [184, 186], "color": "#000000"}, {"edge": [167, 184], "color": "#000000"}, {"edge": [168, 185], "color": "#000000"}, {"edge": [185, 187], "color": "#000000"}, {"edge": [166, 187], "color": "#000000"}, {"edge": [130, 184], "color": "#000000"}, {"edge": [131, 185], "color": "#000000"}, {"edge": [143, 186], "color": "#000000"}, {"edge": [143, 189], "color": "#000000"}, {"edge": [188, 189], "color": "#000000"}, {"edge": [186, 188], "color": "#000000"}, {"edge": [187, 188], "color": "#000000"}, {"edge": [144, 189], "color": "#000000"}, {"edge": [144, 187], "color": "#000000"}, {"edge": [68, 184], "color": "#000000"}, {"edge": [68, 188], "color": "#000000"}, {"edge": [68, 185], "color": "#000000"}, {"edge": [68, 129], "color": "#000000"}, {"edge": [129, 130], "color": "#000000"}, {"edge": [129, 131], "color": "#000000"}, {"edge": [141, 143], "color": "#000000"}, {"edge": [141, 192], "color": "#000000"}, {"edge": [190, 192], "color": "#000000"}, {"edge": [143, 190], "color": "#000000"}, {"edge": [144, 191], "color": "#000000"}, {"edge": [191, 193], "color": "#000000"}, {"edge": [142, 193], "color": "#000000"}, {"edge": [142, 144], "color": "#000000"}, {"edge": [139, 141], "color": "#000000"}, {"edge": [139, 194], "color": "#000000"}, {"edge": [192, 194], "color": "#000000"}, {"edge": [193, 195], "color": "#000000"}, {"edge": [140, 195], "color": "#000000"}, {"edge": [140, 142], "color": "#000000"}, {"edge": [138, 139], "color": "#000000"}, {"edge": [138, 196], "color": "#000000"}, {"edge": [194, 196], "color": "#000000"}, {"edge": [195, 197], "color": "#000000"}, {"edge": [138, 197], "color": "#000000"}, {"edge": [138, 140], "color": "#000000"}, {"edge": [137, 138], "color": "#000000"}, {"edge": [70, 137], "color": "#000000"}, {"edge": [70, 196], "color": "#000000"}, {"edge": [70, 197], "color": "#000000"}, {"edge": [69, 189], "color": "#000000"}, {"edge": [69, 190], "color": "#000000"}, {"edge": [69, 191], "color": "#000000"}, {"edge": [69, 207], "color": "#000000"}, {"edge": [190, 205], "color": "#000000"}, {"edge": [205, 207], "color": "#000000"}, {"edge": [206, 207], "color": "#000000"}, {"edge": [191, 206], "color": "#000000"}, {"edge": [70, 198], "color": "#000000"}, {"edge": [198, 199], "color": "#000000"}, {"edge": [196, 199], "color": "#000000"}, {"edge": [197, 200], "color": "#000000"}, {"edge": [198, 200], "color": "#000000"}, {"edge": [199, 201], "color": "#000000"}, {"edge": [194, 201], "color": "#000000"}, {"edge": [195, 202], "color": "#000000"}, {"edge": [200, 202], "color": "#000000"}, {"edge": [201, 203], "color": "#000000"}, {"edge": [192, 203], "color": "#000000"}, {"edge": [193, 204], "color": "#000000"}, {"edge": [202, 204], "color": "#000000"}, {"edge": [203, 205], "color": "#000000"}, {"edge": [204, 206], "color": "#000000"}, {"edge": [198, 203], "color": "#000000"}, {"edge": [198, 204], "color": "#000000"}, {"edge": [198, 207], "color": "#000000"}, {"edge": [138, 176], "color": "#000000"}, {"edge": [139, 163], "color": "#000000"}, {"edge": [140, 164], "color": "#000000"}, {"edge": [141, 210], "color": "#000000"}, {"edge": [163, 210], "color": "#000000"}, {"edge": [164, 211], "color": "#000000"}, {"edge": [142, 211], "color": "#000000"}, {"edge": [143, 212], "color": "#000000"}, {"edge": [210, 212], "color": "#000000"}, {"edge": [211, 213], "color": "#000000"}, {"edge": [144, 213], "color": "#000000"}, {"edge": [165, 212], "color": "#000000"}, {"edge": [166, 213], "color": "#000000"}, {"edge": [80, 208], "color": "#000000"}, {"edge": [208, 212], "color": "#000000"}, {"edge": [209, 213], "color": "#000000"}, {"edge": [81, 209], "color": "#000000"}, {"edge": [208, 214], "color": "#000000"}, {"edge": [210, 214], "color": "#000000"}, {"edge": [211, 215], "color": "#000000"}, {"edge": [209, 215], "color": "#000000"}, {"edge": [78, 214], "color": "#000000"}, {"edge": [79, 215], "color": "#000000"}, {"edge": [130, 221], "color": "#000000"}, {"edge": [71, 129], "color": "#000000"}, {"edge": [71, 221], "color": "#000000"}, {"edge": [71, 222], "color": "#000000"}, {"edge": [131, 222], "color": "#000000"}, {"edge": [132, 219], "color": "#000000"}, {"edge": [219, 221], "color": "#000000"}, {"edge": [220, 222], "color": "#000000"}, {"edge": [133, 220], "color": "#000000"}, {"edge": [134, 217], "color": "#000000"}, {"edge": [217, 219], "color": "#000000"}, {"edge": [218, 220], "color": "#000000"}, {"edge": [135, 218], "color": "#000000"}, {"edge": [136, 216], "color": "#000000"}, {"edge": [216, 217], "color": "#000000"}, {"edge": [216, 218], "color": "#000000"}, {"edge": [216, 230], "color": "#000000"}, {"edge": [217, 228], "color": "#000000"}, {"edge": [228, 230], "color": "#000000"}, {"edge": [229, 230], "color": "#000000"}, {"edge": [218, 229], "color": "#000000"}, {"edge": [219, 226], "color": "#000000"}, {"edge": [226, 228], "color": "#000000"}, {"edge": [227, 229], "color": "#000000"}, {"edge": [220, 227], "color": "#000000"}, {"edge": [221, 224], "color": "#000000"}, {"edge": [224, 226], "color": "#000000"}, {"edge": [225, 227], "color": "#000000"}, {"edge": [222, 225], "color": "#000000"}, {"edge": [71, 223], "color": "#000000"}, {"edge": [223, 224], "color": "#000000"}, {"edge": [223, 225], "color": "#000000"}, {"edge": [223, 230], "color": "#000000"}, {"edge": [224, 228], "color": "#000000"}, {"edge": [225, 229], "color": "#000000"}, {"edge": [182, 231], "color": "#000000"}, {"edge": [180, 233], "color": "#000000"}, {"edge": [231, 233], "color": "#000000"}, {"edge": [232, 234], "color": "#000000"}, {"edge": [181, 234], "color": "#000000"}, {"edge": [183, 232], "color": "#000000"}, {"edge": [111, 253], "color": "#000000"}, {"edge": [231, 253], "color": "#000000"}, {"edge": [232, 254], "color": "#000000"}, {"edge": [112, 254], "color": "#000000"}, {"edge": [109, 255], "color": "#000000"}, {"edge": [253, 255], "color": "#000000"}, {"edge": [254, 256], "color": "#000000"}, {"edge": [110, 256], "color": "#000000"}, {"edge": [113, 251], "color": "#000000"}, {"edge": [233, 251], "color": "#000000"}, {"edge": [234, 252], "color": "#000000"}, {"edge": [114, 252], "color": "#000000"}, {"edge": [115, 249], "color": "#000000"}, {"edge": [249, 251], "color": "#000000"}, {"edge": [250, 252], "color": "#000000"}, {"edge": [116, 250], "color": "#000000"}, {"edge": [117, 247], "color": "#000000"}, {"edge": [247, 249], "color": "#000000"}, {"edge": [248, 250], "color": "#000000"}, {"edge": [118, 248], "color": "#000000"}, {"edge": [119, 245], "color": "#000000"}, {"edge": [245, 247], "color": "#000000"}, {"edge": [246, 248], "color": "#000000"}, {"edge": [120, 246], "color": "#000000"}, {"edge": [121, 243], "color": "#000000"}, {"edge": [243, 245], "color": "#000000"}, {"edge": [244, 246], "color": "#000000"}, {"edge": [122, 244], "color": "#000000"}, {"edge": [123, 241], "color": "#000000"}, {"edge": [241, 243], "color": "#000000"}, {"edge": [242, 244], "color": "#000000"}, {"edge": [124, 242], "color": "#000000"}, {"edge": [125, 239], "color": "#000000"}, {"edge": [239, 241], "color": "#000000"}, {"edge": [240, 242], "color": "#000000"}, {"edge": [126, 240], "color": "#000000"}, {"edge": [178, 235], "color": "#000000"}, {"edge": [235, 239], "color": "#000000"}, {"edge": [236, 240], "color": "#000000"}, {"edge": [179, 236], "color": "#000000"}, {"edge": [127, 237], "color": "#000000"}, {"edge": [235, 237], "color": "#000000"}, {"edge": [236, 238], "color": "#000000"}, {"edge": [128, 238], "color": "#000000"}, {"edge": [237, 255], "color": "#000000"}, {"edge": [238, 256], "color": "#000000"}, {"edge": [237, 275], "color": "#000000"}, {"edge": [255, 257], "color": "#000000"}, {"edge": [257, 275], "color": "#000000"}, {"edge": [258, 276], "color": "#000000"}, {"edge": [256, 258], "color": "#000000"}, {"edge": [238, 276], "color": "#000000"}, {"edge": [235, 277], "color": "#000000"}, {"edge": [275, 277], "color": "#000000"}, {"edge": [276, 278], "color": "#000000"}, {"edge": [236, 278], "color": "#000000"}, {"edge": [239, 273], "color": "#000000"}, {"edge": [273, 277], "color": "#000000"}, {"edge": [274, 278], "color": "#000000"}, {"edge": [240, 274], "color": "#000000"}, {"edge": [241, 271], "color": "#000000"}, {"edge": [271, 273], "color": "#000000"}, {"edge": [272, 274], "color": "#000000"}, {"edge": [242, 272], "color": "#000000"}, {"edge": [243, 269], "color": "#000000"}, {"edge": [269, 271], "color": "#000000"}, {"edge": [270, 272], "color": "#000000"}, {"edge": [244, 270], "color": "#000000"}, {"edge": [245, 267], "color": "#000000"}, {"edge": [267, 269], "color": "#000000"}, {"edge": [268, 270], "color": "#000000"}, {"edge": [246, 268], "color": "#000000"}, {"edge": [247, 265], "color": "#000000"}, {"edge": [265, 267], "color": "#000000"}, {"edge": [266, 268], "color": "#000000"}, {"edge": [248, 266], "color": "#000000"}, {"edge": [249, 263], "color": "#000000"}, {"edge": [263, 265], "color": "#000000"}, {"edge": [264, 266], "color": "#000000"}, {"edge": [250, 264], "color": "#000000"}, {"edge": [251, 261], "color": "#000000"}, {"edge": [261, 263], "color": "#000000"}, {"edge": [262, 264], "color": "#000000"}, {"edge": [252, 262], "color": "#000000"}, {"edge": [233, 279], "color": "#000000"}, {"edge": [261, 279], "color": "#000000"}, {"edge": [262, 280], "color": "#000000"}, {"edge": [234, 280], "color": "#000000"}, {"edge": [253, 259], "color": "#000000"}, {"edge": [257, 259], "color": "#000000"}, {"edge": [258, 260], "color": "#000000"}, {"edge": [254, 260], "color": "#000000"}, {"edge": [231, 281], "color": "#000000"}, {"edge": [259, 281], "color": "#000000"}, {"edge": [260, 282], "color": "#000000"}, {"edge": [232, 282], "color": "#000000"}, {"edge": [279, 281], "color": "#000000"}, {"edge": [280, 282], "color": "#000000"}, {"edge": [66, 72], "color": "#000000"}, {"edge": [107, 283], "color": "#000000"}, {"edge": [72, 283], "color": "#000000"}, {"edge": [72, 284], "color": "#000000"}, {"edge": [108, 284], "color": "#000000"}, {"edge": [105, 285], "color": "#000000"}, {"edge": [283, 285], "color": "#000000"}, {"edge": [284, 286], "color": "#000000"}, {"edge": [106, 286], "color": "#000000"}, {"edge": [103, 287], "color": "#000000"}, {"edge": [285, 287], "color": "#000000"}, {"edge": [286, 288], "color": "#000000"}, {"edge": [104, 288], "color": "#000000"}, {"edge": [101, 289], "color": "#000000"}, {"edge": [287, 289], "color": "#000000"}, {"edge": [288, 290], "color": "#000000"}, {"edge": [102, 290], "color": "#000000"}, {"edge": [99, 291], "color": "#000000"}, {"edge": [289, 291], "color": "#000000"}, {"edge": [290, 292], "color": "#000000"}, {"edge": [100, 292], "color": "#000000"}, {"edge": [97, 293], "color": "#000000"}, {"edge": [291, 293], "color": "#000000"}, {"edge": [292, 294], "color": "#000000"}, {"edge": [98, 294], "color": "#000000"}, {"edge": [95, 295], "color": "#000000"}, {"edge": [293, 295], "color": "#000000"}, {"edge": [294, 296], "color": "#000000"}, {"edge": [96, 296], "color": "#000000"}, {"edge": [93, 297], "color": "#000000"}, {"edge": [295, 297], "color": "#000000"}, {"edge": [296, 298], "color": "#000000"}, {"edge": [94, 298], "color": "#000000"}, {"edge": [91, 299], "color": "#000000"}, {"edge": [297, 299], "color": "#000000"}, {"edge": [298, 300], "color": "#000000"}, {"edge": [92, 300], "color": "#000000"}, {"edge": [307, 337], "color": "#000000"}, {"edge": [307, 308], "color": "#000000"}, {"edge": [308, 327], "color": "#000000"}, {"edge": [327, 337], "color": "#000000"}, {"edge": [328, 338], "color": "#000000"}, {"edge": [308, 328], "color": "#000000"}, {"edge": [307, 338], "color": "#000000"}, {"edge": [306, 335], "color": "#000000"}, {"edge": [306, 307], "color": "#000000"}, {"edge": [335, 337], "color": "#000000"}, {"edge": [336, 338], "color": "#000000"}, {"edge": [306, 336], "color": "#000000"}, {"edge": [305, 339], "color": "#000000"}, {"edge": [305, 306], "color": "#000000"}, {"edge": [335, 339], "color": "#000000"}, {"edge": [336, 340], "color": "#000000"}, {"edge": [305, 340], "color": "#000000"}, {"edge": [88, 339], "color": "#000000"}, {"edge": [90, 305], "color": "#000000"}, {"edge": [89, 340], "color": "#000000"}, {"edge": [86, 333], "color": "#000000"}, {"edge": [333, 339], "color": "#000000"}, {"edge": [334, 340], "color": "#000000"}, {"edge": [87, 334], "color": "#000000"}, {"edge": [84, 329], "color": "#000000"}, {"edge": [329, 333], "color": "#000000"}, {"edge": [330, 334], "color": "#000000"}, {"edge": [85, 330], "color": "#000000"}, {"edge": [82, 331], "color": "#000000"}, {"edge": [329, 331], "color": "#000000"}, {"edge": [330, 332], "color": "#000000"}, {"edge": [83, 332], "color": "#000000"}, {"edge": [329, 335], "color": "#000000"}, {"edge": [331, 337], "color": "#000000"}, {"edge": [332, 338], "color": "#000000"}, {"edge": [330, 336], "color": "#000000"}, {"edge": [325, 327], "color": "#000000"}, {"edge": [325, 331], "color": "#000000"}, {"edge": [326, 332], "color": "#000000"}, {"edge": [326, 328], "color": "#000000"}, {"edge": [80, 325], "color": "#000000"}, {"edge": [81, 326], "color": "#000000"}, {"edge": [208, 341], "color": "#000000"}, {"edge": [341, 343], "color": "#000000"}, {"edge": [214, 343], "color": "#000000"}, {"edge": [215, 344], "color": "#000000"}, {"edge": [342, 344], "color": "#000000"}, {"edge": [209, 342], "color": "#000000"}, {"edge": [325, 341], "color": "#000000"}, {"edge": [326, 342], "color": "#000000"}, {"edge": [78, 345], "color": "#000000"}, {"edge": [343, 345], "color": "#000000"}, {"edge": [344, 346], "color": "#000000"}, {"edge": [79, 346], "color": "#000000"}, {"edge": [299, 345], "color": "#000000"}, {"edge": [300, 346], "color": "#000000"}, {"edge": [76, 303], "color": "#000000"}, {"edge": [76, 323], "color": "#000000"}, {"edge": [323, 351], "color": "#000000"}, {"edge": [303, 351], "color": "#000000"}, {"edge": [303, 352], "color": "#000000"}, {"edge": [324, 352], "color": "#000000"}, {"edge": [76, 324], "color": "#000000"}, {"edge": [77, 303], "color": "#000000"}, {"edge": [349, 351], "color": "#000000"}, {"edge": [77, 349], "color": "#000000"}, {"edge": [77, 350], "color": "#000000"}, {"edge": [350, 352], "color": "#000000"}, {"edge": [77, 304], "color": "#000000"}, {"edge": [347, 349], "color": "#000000"}, {"edge": [304, 347], "color": "#000000"}, {"edge": [304, 348], "color": "#000000"}, {"edge": [348, 350], "color": "#000000"}, {"edge": [304, 308], "color": "#000000"}, {"edge": [327, 347], "color": "#000000"}, {"edge": [328, 348], "color": "#000000"}, {"edge": [341, 347], "color": "#000000"}, {"edge": [342, 348], "color": "#000000"}, {"edge": [295, 309], "color": "#000000"}, {"edge": [297, 317], "color": "#000000"}, {"edge": [309, 317], "color": "#000000"}, {"edge": [310, 318], "color": "#000000"}, {"edge": [298, 318], "color": "#000000"}, {"edge": [296, 310], "color": "#000000"}, {"edge": [75, 76], "color": "#000000"}, {"edge": [75, 315], "color": "#000000"}, {"edge": [315, 323], "color": "#000000"}, {"edge": [316, 324], "color": "#000000"}, {"edge": [75, 316], "color": "#000000"}, {"edge": [301, 302], "color": "#000000"}, {"edge": [301, 357], "color": "#000000"}, {"edge": [355, 357], "color": "#000000"}, {"edge": [302, 355], "color": "#000000"}, {"edge": [302, 356], "color": "#000000"}, {"edge": [356, 358], "color": "#000000"}, {"edge": [301, 358], "color": "#000000"}, {"edge": [74, 302], "color": "#000000"}, {"edge": [353, 355], "color": "#000000"}, {"edge": [74, 353], "color": "#000000"}, {"edge": [74, 354], "color": "#000000"}, {"edge": [354, 356], "color": "#000000"}, {"edge": [74, 75], "color": "#000000"}, {"edge": [315, 353], "color": "#000000"}, {"edge": [316, 354], "color": "#000000"}, {"edge": [291, 363], "color": "#000000"}, {"edge": [293, 361], "color": "#000000"}, {"edge": [361, 363], "color": "#000000"}, {"edge": [362, 364], "color": "#000000"}, {"edge": [294, 362], "color": "#000000"}, {"edge": [292, 364], "color": "#000000"}, {"edge": [363, 365], "color": "#000000"}, {"edge": [361, 367], "color": "#000000"}, {"edge": [365, 367], "color": "#000000"}, {"edge": [366, 368], "color": "#000000"}, {"edge": [362, 368], "color": "#000000"}, {"edge": [364, 366], "color": "#000000"}, {"edge": [365, 371], "color": "#000000"}, {"edge": [367, 369], "color": "#000000"}, {"edge": [369, 371], "color": "#000000"}, {"edge": [370, 372], "color": "#000000"}, {"edge": [368, 370], "color": "#000000"}, {"edge": [366, 372], "color": "#000000"}, {"edge": [371, 373], "color": "#000000"}, {"edge": [369, 375], "color": "#000000"}, {"edge": [373, 375], "color": "#000000"}, {"edge": [374, 376], "color": "#000000"}, {"edge": [370, 376], "color": "#000000"}, {"edge": [372, 374], "color": "#000000"}, {"edge": [313, 375], "color": "#000000"}, {"edge": [313, 377], "color": "#000000"}, {"edge": [373, 377], "color": "#000000"}, {"edge": [374, 378], "color": "#000000"}, {"edge": [314, 378], "color": "#000000"}, {"edge": [314, 376], "color": "#000000"}, {"edge": [315, 377], "color": "#000000"}, {"edge": [353, 373], "color": "#000000"}, {"edge": [354, 374], "color": "#000000"}, {"edge": [316, 378], "color": "#000000"}, {"edge": [355, 371], "color": "#000000"}, {"edge": [356, 372], "color": "#000000"}, {"edge": [357, 365], "color": "#000000"}, {"edge": [358, 366], "color": "#000000"}, {"edge": [357, 359], "color": "#000000"}, {"edge": [359, 363], "color": "#000000"}, {"edge": [360, 364], "color": "#000000"}, {"edge": [358, 360], "color": "#000000"}, {"edge": [289, 359], "color": "#000000"}, {"edge": [290, 360], "color": "#000000"}, {"edge": [73, 301], "color": "#000000"}, {"edge": [73, 359], "color": "#000000"}, {"edge": [73, 360], "color": "#000000"}, {"edge": [283, 289], "color": "#000000"}, {"edge": [284, 290], "color": "#000000"}, {"edge": [73, 283], "color": "#000000"}, {"edge": [73, 284], "color": "#000000"}, {"edge": [72, 73], "color": "#000000"}, {"edge": [309, 361], "color": "#000000"}, {"edge": [310, 362], "color": "#000000"}, {"edge": [309, 311], "color": "#000000"}, {"edge": [311, 367], "color": "#000000"}, {"edge": [312, 368], "color": "#000000"}, {"edge": [310, 312], "color": "#000000"}, {"edge": [311, 381], "color": "#000000"}, {"edge": [369, 381], "color": "#000000"}, {"edge": [370, 382], "color": "#000000"}, {"edge": [312, 382], "color": "#000000"}, {"edge": [313, 381], "color": "#000000"}, {"edge": [314, 382], "color": "#000000"}, {"edge": [347, 383], "color": "#000000"}, {"edge": [349, 385], "color": "#000000"}, {"edge": [383, 385], "color": "#000000"}, {"edge": [384, 386], "color": "#000000"}, {"edge": [350, 386], "color": "#000000"}, {"edge": [348, 384], "color": "#000000"}, {"edge": [317, 319], "color": "#000000"}, {"edge": [317, 383], "color": "#000000"}, {"edge": [319, 385], "color": "#000000"}, {"edge": [320, 386], "color": "#000000"}, {"edge": [318, 384], "color": "#000000"}, {"edge": [318, 320], "color": "#000000"}, {"edge": [299, 383], "color": "#000000"}, {"edge": [300, 384], "color": "#000000"}, {"edge": [299, 343], "color": "#000000"}, {"edge": [341, 383], "color": "#000000"}, {"edge": [342, 384], "color": "#000000"}, {"edge": [300, 344], "color": "#000000"}, {"edge": [313, 321], "color": "#000000"}, {"edge": [321, 379], "color": "#000000"}, {"edge": [377, 379], "color": "#000000"}, {"edge": [378, 380], "color": "#000000"}, {"edge": [322, 380], "color": "#000000"}, {"edge": [314, 322], "color": "#000000"}, {"edge": [323, 379], "color": "#000000"}, {"edge": [324, 380], "color": "#000000"}, {"edge": [319, 321], "color": "#000000"}, {"edge": [379, 385], "color": "#000000"}, {"edge": [380, 386], "color": "#000000"}, {"edge": [320, 322], "color": "#000000"}, {"edge": [351, 379], "color": "#000000"}, {"edge": [352, 380], "color": "#000000"}, {"edge": [399, 401], "color": "#000000"}, {"edge": [387, 399], "color": "#000000"}, {"edge": [387, 413], "color": "#000000"}, {"edge": [401, 413], "color": "#000000"}, {"edge": [402, 414], "color": "#000000"}, {"edge": [388, 414], "color": "#000000"}, {"edge": [388, 400], "color": "#000000"}, {"edge": [400, 402], "color": "#000000"}, {"edge": [397, 399], "color": "#000000"}, {"edge": [401, 403], "color": "#000000"}, {"edge": [397, 403], "color": "#000000"}, {"edge": [398, 404], "color": "#000000"}, {"edge": [402, 404], "color": "#000000"}, {"edge": [398, 400], "color": "#000000"}, {"edge": [395, 397], "color": "#000000"}, {"edge": [403, 405], "color": "#000000"}, {"edge": [395, 405], "color": "#000000"}, {"edge": [396, 406], "color": "#000000"}, {"edge": [404, 406], "color": "#000000"}, {"edge": [396, 398], "color": "#000000"}, {"edge": [393, 395], "color": "#000000"}, {"edge": [405, 407], "color": "#000000"}, {"edge": [393, 407], "color": "#000000"}, {"edge": [394, 408], "color": "#000000"}, {"edge": [406, 408], "color": "#000000"}, {"edge": [394, 396], "color": "#000000"}, {"edge": [391, 393], "color": "#000000"}, {"edge": [407, 409], "color": "#000000"}, {"edge": [391, 409], "color": "#000000"}, {"edge": [392, 410], "color": "#000000"}, {"edge": [408, 410], "color": "#000000"}, {"edge": [392, 394], "color": "#000000"}, {"edge": [389, 391], "color": "#000000"}, {"edge": [409, 411], "color": "#000000"}, {"edge": [389, 411], "color": "#000000"}, {"edge": [390, 412], "color": "#000000"}, {"edge": [410, 412], "color": "#000000"}, {"edge": [390, 392], "color": "#000000"}, {"edge": [409, 419], "color": "#000000"}, {"edge": [417, 419], "color": "#000000"}, {"edge": [411, 417], "color": "#000000"}, {"edge": [412, 418], "color": "#000000"}, {"edge": [418, 420], "color": "#000000"}, {"edge": [410, 420], "color": "#000000"}, {"edge": [407, 421], "color": "#000000"}, {"edge": [419, 421], "color": "#000000"}, {"edge": [420, 422], "color": "#000000"}, {"edge": [408, 422], "color": "#000000"}, {"edge": [405, 423], "color": "#000000"}, {"edge": [421, 423], "color": "#000000"}, {"edge": [422, 424], "color": "#000000"}, {"edge": [406, 424], "color": "#000000"}, {"edge": [403, 425], "color": "#000000"}, {"edge": [423, 425], "color": "#000000"}, {"edge": [424, 426], "color": "#000000"}, {"edge": [404, 426], "color": "#000000"}, {"edge": [401, 427], "color": "#000000"}, {"edge": [425, 427], "color": "#000000"}, {"edge": [426, 428], "color": "#000000"}, {"edge": [402, 428], "color": "#000000"}, {"edge": [413, 415], "color": "#000000"}, {"edge": [415, 427], "color": "#000000"}, {"edge": [416, 428], "color": "#000000"}, {"edge": [414, 416], "color": "#000000"}, {"edge": [317, 441], "color": "#000000"}, {"edge": [319, 443], "color": "#000000"}, {"edge": [441, 443], "color": "#000000"}, {"edge": [442, 444], "color": "#000000"}, {"edge": [320, 444], "color": "#000000"}, {"edge": [318, 442], "color": "#000000"}, {"edge": [319, 389], "color": "#000000"}, {"edge": [411, 443], "color": "#000000"}, {"edge": [412, 444], "color": "#000000"}, {"edge": [320, 390], "color": "#000000"}, {"edge": [311, 441], "color": "#000000"}, {"edge": [312, 442], "color": "#000000"}, {"edge": [381, 387], "color": "#000000"}, {"edge": [381, 429], "color": "#000000"}, {"edge": [413, 429], "color": "#000000"}, {"edge": [414, 430], "color": "#000000"}, {"edge": [382, 430], "color": "#000000"}, {"edge": [382, 388], "color": "#000000"}, {"edge": [417, 439], "color": "#000000"}, {"edge": [439, 443], "color": "#000000"}, {"edge": [440, 444], "color": "#000000"}, {"edge": [418, 440], "color": "#000000"}, {"edge": [437, 439], "color": "#000000"}, {"edge": [437, 445], "color": "#000000"}, {"edge": [443, 445], "color": "#000000"}, {"edge": [444, 446], "color": "#000000"}, {"edge": [438, 446], "color": "#000000"}, {"edge": [438, 440], "color": "#000000"}, {"edge": [433, 435], "color": "#000000"}, {"edge": [433, 445], "color": "#000000"}, {"edge": [435, 437], "color": "#000000"}, {"edge": [436, 438], "color": "#000000"}, {"edge": [434, 446], "color": "#000000"}, {"edge": [434, 436], "color": "#000000"}, {"edge": [431, 433], "color": "#000000"}, {"edge": [431, 447], "color": "#000000"}, {"edge": [445, 447], "color": "#000000"}, {"edge": [446, 448], "color": "#000000"}, {"edge": [432, 448], "color": "#000000"}, {"edge": [432, 434], "color": "#000000"}, {"edge": [429, 449], "color": "#000000"}, {"edge": [429, 447], "color": "#000000"}, {"edge": [431, 449], "color": "#000000"}, {"edge": [432, 450], "color": "#000000"}, {"edge": [430, 448], "color": "#000000"}, {"edge": [430, 450], "color": "#000000"}, {"edge": [415, 449], "color": "#000000"}, {"edge": [416, 450], "color": "#000000"}, {"edge": [311, 447], "color": "#000000"}, {"edge": [312, 448], "color": "#000000"}, {"edge": [441, 445], "color": "#000000"}, {"edge": [442, 446], "color": "#000000"}, {"edge": [415, 475], "color": "#000000"}, {"edge": [449, 451], "color": "#000000"}, {"edge": [451, 475], "color": "#000000"}, {"edge": [452, 476], "color": "#000000"}, {"edge": [450, 452], "color": "#000000"}, {"edge": [416, 476], "color": "#000000"}, {"edge": [431, 461], "color": "#000000"}, {"edge": [451, 461], "color": "#000000"}, {"edge": [452, 462], "color": "#000000"}, {"edge": [432, 462], "color": "#000000"}, {"edge": [433, 459], "color": "#000000"}, {"edge": [459, 461], "color": "#000000"}, {"edge": [460, 462], "color": "#000000"}, {"edge": [434, 460], "color": "#000000"}, {"edge": [435, 457], "color": "#000000"}, {"edge": [457, 459], "color": "#000000"}, {"edge": [458, 460], "color": "#000000"}, {"edge": [436, 458], "color": "#000000"}, {"edge": [437, 455], "color": "#000000"}, {"edge": [455, 457], "color": "#000000"}, {"edge": [456, 458], "color": "#000000"}, {"edge": [438, 456], "color": "#000000"}, {"edge": [439, 453], "color": "#000000"}, {"edge": [453, 455], "color": "#000000"}, {"edge": [454, 456], "color": "#000000"}, {"edge": [440, 454], "color": "#000000"}, {"edge": [417, 473], "color": "#000000"}, {"edge": [453, 473], "color": "#000000"}, {"edge": [454, 474], "color": "#000000"}, {"edge": [418, 474], "color": "#000000"}, {"edge": [427, 463], "color": "#000000"}, {"edge": [463, 475], "color": "#000000"}, {"edge": [464, 476], "color": "#000000"}, {"edge": [428, 464], "color": "#000000"}, {"edge": [425, 465], "color": "#000000"}, {"edge": [463, 465], "color": "#000000"}, {"edge": [464, 466], "color": "#000000"}, {"edge": [426, 466], "color": "#000000"}, {"edge": [423, 467], "color": "#000000"}, {"edge": [465, 467], "color": "#000000"}, {"edge": [466, 468], "color": "#000000"}, {"edge": [424, 468], "color": "#000000"}, {"edge": [421, 469], "color": "#000000"}, {"edge": [467, 469], "color": "#000000"}, {"edge": [468, 470], "color": "#000000"}, {"edge": [422, 470], "color": "#000000"}, {"edge": [419, 471], "color": "#000000"}, {"edge": [469, 471], "color": "#000000"}, {"edge": [470, 472], "color": "#000000"}, {"edge": [420, 472], "color": "#000000"}, {"edge": [471, 473], "color": "#000000"}, {"edge": [472, 474], "color": "#000000"}, {"edge": [457, 477], "color": "#000000"}, {"edge": [455, 479], "color": "#000000"}, {"edge": [477, 479], "color": "#000000"}, {"edge": [478, 480], "color": "#000000"}, {"edge": [456, 480], "color": "#000000"}, {"edge": [458, 478], "color": "#000000"}, {"edge": [477, 483], "color": "#000000"}, {"edge": [479, 481], "color": "#000000"}, {"edge": [481, 483], "color": "#000000"}, {"edge": [482, 484], "color": "#000000"}, {"edge": [480, 482], "color": "#000000"}, {"edge": [478, 484], "color": "#000000"}, {"edge": [483, 485], "color": "#000000"}, {"edge": [481, 487], "color": "#000000"}, {"edge": [485, 487], "color": "#000000"}, {"edge": [486, 488], "color": "#000000"}, {"edge": [482, 488], "color": "#000000"}, {"edge": [484, 486], "color": "#000000"}, {"edge": [485, 491], "color": "#000000"}, {"edge": [487, 489], "color": "#000000"}, {"edge": [489, 491], "color": "#000000"}, {"edge": [490, 492], "color": "#000000"}, {"edge": [488, 490], "color": "#000000"}, {"edge": [486, 492], "color": "#000000"}, {"edge": [463, 491], "color": "#000000"}, {"edge": [475, 485], "color": "#000000"}, {"edge": [476, 486], "color": "#000000"}, {"edge": [464, 492], "color": "#000000"}, {"edge": [451, 483], "color": "#000000"}, {"edge": [452, 484], "color": "#000000"}, {"edge": [461, 477], "color": "#000000"}, {"edge": [462, 478], "color": "#000000"}, {"edge": [473, 479], "color": "#000000"}, {"edge": [474, 480], "color": "#000000"}, {"edge": [471, 481], "color": "#000000"}, {"edge": [472, 482], "color": "#000000"}, {"edge": [469, 487], "color": "#000000"}, {"edge": [470, 488], "color": "#000000"}, {"edge": [467, 489], "color": "#000000"}, {"edge": [468, 490], "color": "#000000"}, {"edge": [465, 491], "color": "#000000"}, {"edge": [466, 492], "color": "#000000"}, {"edge": [391, 501], "color": "#000000"}, {"edge": [389, 503], "color": "#000000"}, {"edge": [501, 503], "color": "#000000"}, {"edge": [502, 504], "color": "#000000"}, {"edge": [390, 504], "color": "#000000"}, {"edge": [392, 502], "color": "#000000"}, {"edge": [393, 499], "color": "#000000"}, {"edge": [499, 501], "color": "#000000"}, {"edge": [500, 502], "color": "#000000"}, {"edge": [394, 500], "color": "#000000"}, {"edge": [395, 497], "color": "#000000"}, {"edge": [497, 499], "color": "#000000"}, {"edge": [498, 500], "color": "#000000"}, {"edge": [396, 498], "color": "#000000"}, {"edge": [397, 495], "color": "#000000"}, {"edge": [495, 497], "color": "#000000"}, {"edge": [496, 498], "color": "#000000"}, {"edge": [398, 496], "color": "#000000"}, {"edge": [399, 493], "color": "#000000"}, {"edge": [493, 495], "color": "#000000"}, {"edge": [494, 496], "color": "#000000"}, {"edge": [400, 494], "color": "#000000"}, {"edge": [387, 505], "color": "#000000"}, {"edge": [493, 505], "color": "#000000"}, {"edge": [494, 506], "color": "#000000"}, {"edge": [388, 506], "color": "#000000"}, {"edge": [493, 501], "color": "#000000"}, {"edge": [503, 505], "color": "#000000"}, {"edge": [504, 506], "color": "#000000"}, {"edge": [494, 502], "color": "#000000"}, {"edge": [495, 499], "color": "#000000"}, {"edge": [496, 500], "color": "#000000"}, {"edge": [313, 505], "color": "#000000"}, {"edge": [314, 506], "color": "#000000"}, {"edge": [321, 503], "color": "#000000"}, {"edge": [322, 504], "color": "#000000"}], "faces": [{"face": [46, 0, 2, 44], "color": "#0000FF"}, {"face": [3, 1, 47, 45], "color": "#0000FF"}, {"face": [44, 2, 4, 42], "color": "#0000FF"}, {"face": [5, 3, 45, 43], "color": "#0000FF"}, {"face": [2, 8, 6, 4], "color": "#0000FF"}, {"face": [7, 9, 3, 5], "color": "#0000FF"}, {"face": [0, 10, 8, 2], "color": "#0000FF"}, {"face": [9, 11, 1, 3], "color": "#0000FF"}, {"face": [10, 12, 14, 8], "color": "#0000FF"}, {"face": [15, 13, 11, 9], "color": "#0000FF"}, {"face": [8, 14, 16, 6], "color": "#0000FF"}, {"face": [17, 15, 9, 7], "color": "#0000FF"}, {"face": [14, 20, 18, 16], "color": "#0000FF"}, {"face": [19, 21, 15, 17], "color": "#0000FF"}, {"face": [12, 22, 20, 14], "color": "#0000FF"}, {"face": [21, 23, 13, 15], "color": "#0000FF"}, {"face": [22, 24, 26, 20], "color": "#0000FF"}, {"face": [27, 25, 23, 21], "color": "#0000FF"}, {"face": [20, 26, 28, 18], "color": "#0000FF"}, {"face": [29, 27, 21, 19], "color": "#0000FF"}, {"face": [26, 32, 30, 28], "color": "#0000FF"}, {"face": [31, 33, 27, 29], "color": "#0000FF"}, {"face": [24, 34, 32, 26], "color": "#0000FF"}, {"face": [33, 35, 25, 27], "color": "#0000FF"}, {"face": [34, 36, 38, 32], "color": "#0000FF"}, {"face": [39, 37, 35, 33], "color": "#0000FF"}, {"face": [32, 38, 40, 30], "color": "#0000FF"}, {"face": [41, 39, 33, 31], "color": "#0000FF"}, {"face": [38, 44, 42, 40], "color": "#0000FF"}, {"face": [43, 45, 39, 41], "color": "#0000FF"}, {"face": [36, 46, 44, 38], "color": "#0000FF"}, {"face": [45, 47, 37, 39], "color": "#0000FF"}, {"face": [46, 36, 50, 48], "color": "#0000FF"}, {"face": [51, 37, 47, 49], "color": "#0000FF"}, {"face": [36, 34, 52, 50], "color": "#0000FF"}, {"face": [53, 35, 37, 51], "color": "#0000FF"}, {"face": [34, 24, 54, 52], "color": "#0000FF"}, {"face": [55, 25, 35, 53], "color": "#0000FF"}, {"face": [24, 22, 56, 54], "color": "#0000FF"}, {"face": [57, 23, 25, 55], "color": "#0000FF"}, {"face": [22, 12, 58, 56], "color": "#0000FF"}, {"face": [59, 13, 23, 57], "color": "#0000FF"}, {"face": [12, 10, 62, 58], "color": "#0000FF"}, {"face": [63, 11, 13, 59], "color": "#0000FF"}, {"face": [10, 0, 64, 62], "color": "#0000FF"}, {"face": [65, 1, 11, 63], "color": "#0000FF"}, {"face": [0, 46, 48, 64], "color": "#0000FF"}, {"face": [49, 47, 1, 65], "color": "#0000FF"}, {"face": [60, 64, 48], "color": "#0000FF"}, {"face": [49, 65, 61], "color": "#0000FF"}, {"face": [62, 64, 60], "color": "#0000FF"}, {"face": [61, 65, 63], "color": "#0000FF"}, {"face": [60, 58, 62], "color": "#0000FF"}, {"face": [63, 59, 61], "color": "#0000FF"}, {"face": [60, 56, 58], "color": "#0000FF"}, {"face": [59, 57, 61], "color": "#0000FF"}, {"face": [60, 54, 56], "color": "#0000FF"}, {"face": [57, 55, 61], "color": "#0000FF"}, {"face": [60, 52, 54], "color": "#0000FF"}, {"face": [55, 53, 61], "color": "#0000FF"}, {"face": [60, 50, 52], "color": "#0000FF"}, {"face": [53, 51, 61], "color": "#0000FF"}, {"face": [60, 48, 50], "color": "#0000FF"}, {"face": [51, 49, 61], "color": "#0000FF"}, {"face": [88, 173, 175, 90], "color": "#0000FF"}, {"face": [175, 174, 89, 90], "color": "#0000FF"}, {"face": [86, 171, 173, 88], "color": "#0000FF"}, {"face": [174, 172, 87, 89], "color": "#0000FF"}, {"face": [84, 169, 171, 86], "color": "#0000FF"}, {"face": [172, 170, 85, 87], "color": "#0000FF"}, {"face": [82, 167, 169, 84], "color": "#0000FF"}, {"face": [170, 168, 83, 85], "color": "#0000FF"}, {"face": [80, 165, 167, 82], "color": "#0000FF"}, {"face": [168, 166, 81, 83], "color": "#0000FF"}, {"face": [78, 91, 145, 163], "color": "#0000FF"}, {"face": [146, 92, 79, 164], "color": "#0000FF"}, {"face": [91, 93, 147, 145], "color": "#0000FF"}, {"face": [148, 94, 92, 146], "color": "#0000FF"}, {"face": [93, 95, 149, 147], "color": "#0000FF"}, {"face": [150, 96, 94, 148], "color": "#0000FF"}, {"face": [95, 97, 151, 149], "color": "#0000FF"}, {"face": [152, 98, 96, 150], "color": "#0000FF"}, {"face": [97, 99, 153, 151], "color": "#0000FF"}, {"face": [154, 100, 98, 152], "color": "#0000FF"}, {"face": [99, 101, 155, 153], "color": "#0000FF"}, {"face": [156, 102, 100, 154], "color": "#0000FF"}, {"face": [101, 103, 157, 155], "color": "#0000FF"}, {"face": [158, 104, 102, 156], "color": "#0000FF"}, {"face": [103, 105, 159, 157], "color": "#0000FF"}, {"face": [160, 106, 104, 158], "color": "#0000FF"}, {"face": [105, 107, 161, 159], "color": "#0000FF"}, {"face": [162, 108, 106, 160], "color": "#0000FF"}, {"face": [107, 66, 67, 161], "color": "#0000FF"}, {"face": [67, 66, 108, 162], "color": "#0000FF"}, {"face": [109, 127, 159, 161], "color": "#0000FF"}, {"face": [160, 128, 110, 162], "color": "#0000FF"}, {"face": [127, 178, 157, 159], "color": "#0000FF"}, {"face": [158, 179, 128, 160], "color": "#0000FF"}, {"face": [125, 155, 157, 178], "color": "#0000FF"}, {"face": [158, 156, 126, 179], "color": "#0000FF"}, {"face": [123, 153, 155, 125], "color": "#0000FF"}, {"face": [156, 154, 124, 126], "color": "#0000FF"}, {"face": [121, 151, 153, 123], "color": "#0000FF"}, {"face": [154, 152, 122, 124], "color": "#0000FF"}, {"face": [119, 149, 151, 121], "color": "#0000FF"}, {"face": [152, 150, 120, 122], "color": "#0000FF"}, {"face": [117, 147, 149, 119], "color": "#0000FF"}, {"face": [150, 148, 118, 120], "color": "#0000FF"}, {"face": [115, 145, 147, 117], "color": "#0000FF"}, {"face": [148, 146, 116, 118], "color": "#0000FF"}, {"face": [113, 163, 145, 115], "color": "#0000FF"}, {"face": [146, 164, 114, 116], "color": "#0000FF"}, {"face": [113, 180, 176, 163], "color": "#0000FF"}, {"face": [176, 181, 114, 164], "color": "#0000FF"}, {"face": [109, 161, 67, 111], "color": "#0000FF"}, {"face": [67, 162, 110, 112], "color": "#0000FF"}, {"face": [111, 67, 177, 182], "color": "#0000FF"}, {"face": [177, 67, 112, 183], "color": "#0000FF"}, {"face": [176, 180, 182, 177], "color": "#0000FF"}, {"face": [183, 181, 176, 177], "color": "#0000FF"}, {"face": [134, 136, 175, 173], "color": "#0000FF"}, {"face": [175, 136, 135, 174], "color": "#0000FF"}, {"face": [132, 134, 173, 171], "color": "#0000FF"}, {"face": [174, 135, 133, 172], "color": "#0000FF"}, {"face": [130, 132, 171, 169], "color": "#0000FF"}, {"face": [172, 133, 131, 170], "color": "#0000FF"}, {"face": [165, 186, 184, 167], "color": "#0000FF"}, {"face": [185, 187, 166, 168], "color": "#0000FF"}, {"face": [130, 169, 167, 184], "color": "#0000FF"}, {"face": [168, 170, 131, 185], "color": "#0000FF"}, {"face": [143, 189, 188, 186], "color": "#0000FF"}, {"face": [188, 189, 144, 187], "color": "#0000FF"}, {"face": [184, 186, 188, 68], "color": "#0000FF"}, {"face": [188, 187, 185, 68], "color": "#0000FF"}, {"face": [129, 130, 184, 68], "color": "#0000FF"}, {"face": [185, 131, 129, 68], "color": "#0000FF"}, {"face": [141, 192, 190, 143], "color": "#0000FF"}, {"face": [191, 193, 142, 144], "color": "#0000FF"}, {"face": [139, 194, 192, 141], "color": "#0000FF"}, {"face": [193, 195, 140, 142], "color": "#0000FF"}, {"face": [138, 196, 194, 139], "color": "#0000FF"}, {"face": [195, 197, 138, 140], "color": "#0000FF"}, {"face": [137, 70, 196, 138], "color": "#0000FF"}, {"face": [197, 70, 137, 138], "color": "#0000FF"}, {"face": [189, 143, 190, 69], "color": "#0000FF"}, {"face": [191, 144, 189, 69], "color": "#0000FF"}, {"face": [69, 190, 205, 207], "color": "#0000FF"}, {"face": [206, 191, 69, 207], "color": "#0000FF"}, {"face": [70, 198, 199, 196], "color": "#0000FF"}, {"face": [200, 198, 70, 197], "color": "#0000FF"}, {"face": [196, 199, 201, 194], "color": "#0000FF"}, {"face": [202, 200, 197, 195], "color": "#0000FF"}, {"face": [194, 201, 203, 192], "color": "#0000FF"}, {"face": [204, 202, 195, 193], "color": "#0000FF"}, {"face": [192, 203, 205, 190], "color": "#0000FF"}, {"face": [206, 204, 193, 191], "color": "#0000FF"}, {"face": [198, 203, 201, 199], "color": "#0000FF"}, {"face": [202, 204, 198, 200], "color": "#0000FF"}, {"face": [198, 207, 205, 203], "color": "#0000FF"}, {"face": [206, 207, 198, 204], "color": "#0000FF"}, {"face": [138, 139, 163, 176], "color": "#0000FF"}, {"face": [164, 140, 138, 176], "color": "#0000FF"}, {"face": [139, 141, 210, 163], "color": "#0000FF"}, {"face": [211, 142, 140, 164], "color": "#0000FF"}, {"face": [141, 143, 212, 210], "color": "#0000FF"}, {"face": [213, 144, 142, 211], "color": "#0000FF"}, {"face": [143, 186, 165, 212], "color": "#0000FF"}, {"face": [166, 187, 144, 213], "color": "#0000FF"}, {"face": [80, 208, 212, 165], "color": "#0000FF"}, {"face": [213, 209, 81, 166], "color": "#0000FF"}, {"face": [208, 214, 210, 212], "color": "#0000FF"}, {"face": [211, 215, 209, 213], "color": "#0000FF"}, {"face": [78, 163, 210, 214], "color": "#0000FF"}, {"face": [211, 164, 79, 215], "color": "#0000FF"}, {"face": [130, 129, 71, 221], "color": "#0000FF"}, {"face": [71, 129, 131, 222], "color": "#0000FF"}, {"face": [132, 130, 221, 219], "color": "#0000FF"}, {"face": [222, 131, 133, 220], "color": "#0000FF"}, {"face": [134, 132, 219, 217], "color": "#0000FF"}, {"face": [220, 133, 135, 218], "color": "#0000FF"}, {"face": [136, 134, 217, 216], "color": "#0000FF"}, {"face": [218, 135, 136, 216], "color": "#0000FF"}, {"face": [216, 217, 228, 230], "color": "#0000FF"}, {"face": [229, 218, 216, 230], "color": "#0000FF"}, {"face": [217, 219, 226, 228], "color": "#0000FF"}, {"face": [227, 220, 218, 229], "color": "#0000FF"}, {"face": [219, 221, 224, 226], "color": "#0000FF"}, {"face": [225, 222, 220, 227], "color": "#0000FF"}, {"face": [221, 71, 223, 224], "color": "#0000FF"}, {"face": [223, 71, 222, 225], "color": "#0000FF"}, {"face": [223, 230, 228, 224], "color": "#0000FF"}, {"face": [229, 230, 223, 225], "color": "#0000FF"}, {"face": [224, 228, 226], "color": "#0000FF"}, {"face": [227, 229, 225], "color": "#0000FF"}, {"face": [182, 180, 233, 231], "color": "#0000FF"}, {"face": [234, 181, 183, 232], "color": "#0000FF"}, {"face": [111, 182, 231, 253], "color": "#0000FF"}, {"face": [232, 183, 112, 254], "color": "#0000FF"}, {"face": [109, 111, 253, 255], "color": "#0000FF"}, {"face": [254, 112, 110, 256], "color": "#0000FF"}, {"face": [180, 113, 251, 233], "color": "#0000FF"}, {"face": [252, 114, 181, 234], "color": "#0000FF"}, {"face": [113, 115, 249, 251], "color": "#0000FF"}, {"face": [250, 116, 114, 252], "color": "#0000FF"}, {"face": [115, 117, 247, 249], "color": "#0000FF"}, {"face": [248, 118, 116, 250], "color": "#0000FF"}, {"face": [117, 119, 245, 247], "color": "#0000FF"}, {"face": [246, 120, 118, 248], "color": "#0000FF"}, {"face": [119, 121, 243, 245], "color": "#0000FF"}, {"face": [244, 122, 120, 246], "color": "#0000FF"}, {"face": [121, 123, 241, 243], "color": "#0000FF"}, {"face": [242, 124, 122, 244], "color": "#0000FF"}, {"face": [123, 125, 239, 241], "color": "#0000FF"}, {"face": [240, 126, 124, 242], "color": "#0000FF"}, {"face": [125, 178, 235, 239], "color": "#0000FF"}, {"face": [236, 179, 126, 240], "color": "#0000FF"}, {"face": [178, 127, 237, 235], "color": "#0000FF"}, {"face": [238, 128, 179, 236], "color": "#0000FF"}, {"face": [127, 109, 255, 237], "color": "#0000FF"}, {"face": [256, 110, 128, 238], "color": "#0000FF"}, {"face": [237, 255, 257, 275], "color": "#0000FF"}, {"face": [258, 256, 238, 276], "color": "#0000FF"}, {"face": [235, 237, 275, 277], "color": "#0000FF"}, {"face": [276, 238, 236, 278], "color": "#0000FF"}, {"face": [239, 235, 277, 273], "color": "#0000FF"}, {"face": [278, 236, 240, 274], "color": "#0000FF"}, {"face": [241, 239, 273, 271], "color": "#0000FF"}, {"face": [274, 240, 242, 272], "color": "#0000FF"}, {"face": [243, 241, 271, 269], "color": "#0000FF"}, {"face": [272, 242, 244, 270], "color": "#0000FF"}, {"face": [245, 243, 269, 267], "color": "#0000FF"}, {"face": [270, 244, 246, 268], "color": "#0000FF"}, {"face": [247, 245, 267, 265], "color": "#0000FF"}, {"face": [268, 246, 248, 266], "color": "#0000FF"}, {"face": [249, 247, 265, 263], "color": "#0000FF"}, {"face": [266, 248, 250, 264], "color": "#0000FF"}, {"face": [251, 249, 263, 261], "color": "#0000FF"}, {"face": [264, 250, 252, 262], "color": "#0000FF"}, {"face": [233, 251, 261, 279], "color": "#0000FF"}, {"face": [262, 252, 234, 280], "color": "#0000FF"}, {"face": [255, 253, 259, 257], "color": "#0000FF"}, {"face": [260, 254, 256, 258], "color": "#0000FF"}, {"face": [253, 231, 281, 259], "color": "#0000FF"}, {"face": [282, 232, 254, 260], "color": "#0000FF"}, {"face": [231, 233, 279, 281], "color": "#0000FF"}, {"face": [280, 234, 232, 282], "color": "#0000FF"}, {"face": [66, 107, 283, 72], "color": "#0000FF"}, {"face": [284, 108, 66, 72], "color": "#0000FF"}, {"face": [107, 105, 285, 283], "color": "#0000FF"}, {"face": [286, 106, 108, 284], "color": "#0000FF"}, {"face": [105, 103, 287, 285], "color": "#0000FF"}, {"face": [288, 104, 106, 286], "color": "#0000FF"}, {"face": [103, 101, 289, 287], "color": "#0000FF"}, {"face": [290, 102, 104, 288], "color": "#0000FF"}, {"face": [101, 99, 291, 289], "color": "#0000FF"}, {"face": [292, 100, 102, 290], "color": "#0000FF"}, {"face": [99, 97, 293, 291], "color": "#0000FF"}, {"face": [294, 98, 100, 292], "color": "#0000FF"}, {"face": [97, 95, 295, 293], "color": "#0000FF"}, {"face": [296, 96, 98, 294], "color": "#0000FF"}, {"face": [95, 93, 297, 295], "color": "#0000FF"}, {"face": [298, 94, 96, 296], "color": "#0000FF"}, {"face": [93, 91, 299, 297], "color": "#0000FF"}, {"face": [300, 92, 94, 298], "color": "#0000FF"}, {"face": [307, 308, 327, 337], "color": "#0000FF"}, {"face": [328, 308, 307, 338], "color": "#0000FF"}, {"face": [306, 307, 337, 335], "color": "#0000FF"}, {"face": [338, 307, 306, 336], "color": "#0000FF"}, {"face": [305, 306, 335, 339], "color": "#0000FF"}, {"face": [336, 306, 305, 340], "color": "#0000FF"}, {"face": [88, 90, 305, 339], "color": "#0000FF"}, {"face": [305, 90, 89, 340], "color": "#0000FF"}, {"face": [86, 88, 339, 333], "color": "#0000FF"}, {"face": [340, 89, 87, 334], "color": "#0000FF"}, {"face": [84, 86, 333, 329], "color": "#0000FF"}, {"face": [334, 87, 85, 330], "color": "#0000FF"}, {"face": [82, 84, 329, 331], "color": "#0000FF"}, {"face": [330, 85, 83, 332], "color": "#0000FF"}, {"face": [329, 335, 337, 331], "color": "#0000FF"}, {"face": [338, 336, 330, 332], "color": "#0000FF"}, {"face": [329, 333, 339, 335], "color": "#0000FF"}, {"face": [340, 334, 330, 336], "color": "#0000FF"}, {"face": [325, 331, 337, 327], "color": "#0000FF"}, {"face": [338, 332, 326, 328], "color": "#0000FF"}, {"face": [80, 82, 331, 325], "color": "#0000FF"}, {"face": [332, 83, 81, 326], "color": "#0000FF"}, {"face": [208, 341, 343, 214], "color": "#0000FF"}, {"face": [344, 342, 209, 215], "color": "#0000FF"}, {"face": [80, 325, 341, 208], "color": "#0000FF"}, {"face": [342, 326, 81, 209], "color": "#0000FF"}, {"face": [78, 214, 343, 345], "color": "#0000FF"}, {"face": [344, 215, 79, 346], "color": "#0000FF"}, {"face": [78, 345, 299, 91], "color": "#0000FF"}, {"face": [300, 346, 79, 92], "color": "#0000FF"}, {"face": [76, 323, 351, 303], "color": "#0000FF"}, {"face": [352, 324, 76, 303], "color": "#0000FF"}, {"face": [303, 351, 349, 77], "color": "#0000FF"}, {"face": [350, 352, 303, 77], "color": "#0000FF"}, {"face": [77, 349, 347, 304], "color": "#0000FF"}, {"face": [348, 350, 77, 304], "color": "#0000FF"}, {"face": [304, 347, 327, 308], "color": "#0000FF"}, {"face": [328, 348, 304, 308], "color": "#0000FF"}, {"face": [325, 327, 347, 341], "color": "#0000FF"}, {"face": [348, 328, 326, 342], "color": "#0000FF"}, {"face": [295, 297, 317, 309], "color": "#0000FF"}, {"face": [318, 298, 296, 310], "color": "#0000FF"}, {"face": [75, 315, 323, 76], "color": "#0000FF"}, {"face": [324, 316, 75, 76], "color": "#0000FF"}, {"face": [301, 357, 355, 302], "color": "#0000FF"}, {"face": [356, 358, 301, 302], "color": "#0000FF"}, {"face": [302, 355, 353, 74], "color": "#0000FF"}, {"face": [354, 356, 302, 74], "color": "#0000FF"}, {"face": [74, 353, 315, 75], "color": "#0000FF"}, {"face": [316, 354, 74, 75], "color": "#0000FF"}, {"face": [291, 293, 361, 363], "color": "#0000FF"}, {"face": [362, 294, 292, 364], "color": "#0000FF"}, {"face": [363, 361, 367, 365], "color": "#0000FF"}, {"face": [368, 362, 364, 366], "color": "#0000FF"}, {"face": [365, 367, 369, 371], "color": "#0000FF"}, {"face": [370, 368, 366, 372], "color": "#0000FF"}, {"face": [371, 369, 375, 373], "color": "#0000FF"}, {"face": [376, 370, 372, 374], "color": "#0000FF"}, {"face": [313, 377, 373, 375], "color": "#0000FF"}, {"face": [374, 378, 314, 376], "color": "#0000FF"}, {"face": [315, 353, 373, 377], "color": "#0000FF"}, {"face": [374, 354, 316, 378], "color": "#0000FF"}, {"face": [353, 355, 371, 373], "color": "#0000FF"}, {"face": [372, 356, 354, 374], "color": "#0000FF"}, {"face": [355, 357, 365, 371], "color": "#0000FF"}, {"face": [366, 358, 356, 372], "color": "#0000FF"}, {"face": [357, 359, 363, 365], "color": "#0000FF"}, {"face": [364, 360, 358, 366], "color": "#0000FF"}, {"face": [289, 291, 363, 359], "color": "#0000FF"}, {"face": [364, 292, 290, 360], "color": "#0000FF"}, {"face": [73, 359, 357, 301], "color": "#0000FF"}, {"face": [358, 360, 73, 301], "color": "#0000FF"}, {"face": [283, 285, 287, 289], "color": "#0000FF"}, {"face": [288, 286, 284, 290], "color": "#0000FF"}, {"face": [283, 289, 359, 73], "color": "#0000FF"}, {"face": [360, 290, 284, 73], "color": "#0000FF"}, {"face": [72, 283, 73], "color": "#0000FF"}, {"face": [73, 284, 72], "color": "#0000FF"}, {"face": [293, 295, 309, 361], "color": "#0000FF"}, {"face": [310, 296, 294, 362], "color": "#0000FF"}, {"face": [309, 311, 367, 361], "color": "#0000FF"}, {"face": [368, 312, 310, 362], "color": "#0000FF"}, {"face": [311, 381, 369, 367], "color": "#0000FF"}, {"face": [370, 382, 312, 368], "color": "#0000FF"}, {"face": [313, 375, 369, 381], "color": "#0000FF"}, {"face": [370, 376, 314, 382], "color": "#0000FF"}, {"face": [347, 349, 385, 383], "color": "#0000FF"}, {"face": [386, 350, 348, 384], "color": "#0000FF"}, {"face": [317, 383, 385, 319], "color": "#0000FF"}, {"face": [386, 384, 318, 320], "color": "#0000FF"}, {"face": [297, 299, 383, 317], "color": "#0000FF"}, {"face": [384, 300, 298, 318], "color": "#0000FF"}, {"face": [299, 343, 341, 383], "color": "#0000FF"}, {"face": [342, 344, 300, 384], "color": "#0000FF"}, {"face": [341, 347, 383], "color": "#0000FF"}, {"face": [384, 348, 342], "color": "#0000FF"}, {"face": [299, 345, 343], "color": "#0000FF"}, {"face": [344, 346, 300], "color": "#0000FF"}, {"face": [313, 321, 379, 377], "color": "#0000FF"}, {"face": [380, 322, 314, 378], "color": "#0000FF"}, {"face": [315, 377, 379, 323], "color": "#0000FF"}, {"face": [380, 378, 316, 324], "color": "#0000FF"}, {"face": [319, 385, 379, 321], "color": "#0000FF"}, {"face": [380, 386, 320, 322], "color": "#0000FF"}, {"face": [349, 351, 379, 385], "color": "#0000FF"}, {"face": [380, 352, 350, 386], "color": "#0000FF"}, {"face": [323, 379, 351], "color": "#0000FF"}, {"face": [352, 380, 324], "color": "#0000FF"}, {"face": [399, 387, 413, 401], "color": "#0000FF"}, {"face": [414, 388, 400, 402], "color": "#0000FF"}, {"face": [399, 401, 403, 397], "color": "#0000FF"}, {"face": [404, 402, 400, 398], "color": "#0000FF"}, {"face": [397, 403, 405, 395], "color": "#0000FF"}, {"face": [406, 404, 398, 396], "color": "#0000FF"}, {"face": [395, 405, 407, 393], "color": "#0000FF"}, {"face": [408, 406, 396, 394], "color": "#0000FF"}, {"face": [393, 407, 409, 391], "color": "#0000FF"}, {"face": [410, 408, 394, 392], "color": "#0000FF"}, {"face": [391, 409, 411, 389], "color": "#0000FF"}, {"face": [412, 410, 392, 390], "color": "#0000FF"}, {"face": [409, 419, 417, 411], "color": "#0000FF"}, {"face": [418, 420, 410, 412], "color": "#0000FF"}, {"face": [407, 421, 419, 409], "color": "#0000FF"}, {"face": [420, 422, 408, 410], "color": "#0000FF"}, {"face": [405, 423, 421, 407], "color": "#0000FF"}, {"face": [422, 424, 406, 408], "color": "#0000FF"}, {"face": [403, 425, 423, 405], "color": "#0000FF"}, {"face": [424, 426, 404, 406], "color": "#0000FF"}, {"face": [401, 427, 425, 403], "color": "#0000FF"}, {"face": [426, 428, 402, 404], "color": "#0000FF"}, {"face": [401, 413, 415, 427], "color": "#0000FF"}, {"face": [416, 414, 402, 428], "color": "#0000FF"}, {"face": [317, 319, 443, 441], "color": "#0000FF"}, {"face": [444, 320, 318, 442], "color": "#0000FF"}, {"face": [319, 389, 411, 443], "color": "#0000FF"}, {"face": [412, 390, 320, 444], "color": "#0000FF"}, {"face": [309, 317, 441, 311], "color": "#0000FF"}, {"face": [442, 318, 310, 312], "color": "#0000FF"}, {"face": [381, 429, 413, 387], "color": "#0000FF"}, {"face": [414, 430, 382, 388], "color": "#0000FF"}, {"face": [411, 417, 439, 443], "color": "#0000FF"}, {"face": [440, 418, 412, 444], "color": "#0000FF"}, {"face": [437, 445, 443, 439], "color": "#0000FF"}, {"face": [444, 446, 438, 440], "color": "#0000FF"}, {"face": [433, 445, 437, 435], "color": "#0000FF"}, {"face": [438, 446, 434, 436], "color": "#0000FF"}, {"face": [431, 447, 445, 433], "color": "#0000FF"}, {"face": [446, 448, 432, 434], "color": "#0000FF"}, {"face": [429, 447, 431, 449], "color": "#0000FF"}, {"face": [432, 448, 430, 450], "color": "#0000FF"}, {"face": [413, 429, 449, 415], "color": "#0000FF"}, {"face": [450, 430, 414, 416], "color": "#0000FF"}, {"face": [311, 447, 429, 381], "color": "#0000FF"}, {"face": [430, 448, 312, 382], "color": "#0000FF"}, {"face": [311, 441, 445, 447], "color": "#0000FF"}, {"face": [446, 442, 312, 448], "color": "#0000FF"}, {"face": [441, 443, 445], "color": "#0000FF"}, {"face": [446, 444, 442], "color": "#0000FF"}, {"face": [415, 449, 451, 475], "color": "#0000FF"}, {"face": [452, 450, 416, 476], "color": "#0000FF"}, {"face": [449, 431, 461, 451], "color": "#0000FF"}, {"face": [462, 432, 450, 452], "color": "#0000FF"}, {"face": [431, 433, 459, 461], "color": "#0000FF"}, {"face": [460, 434, 432, 462], "color": "#0000FF"}, {"face": [433, 435, 457, 459], "color": "#0000FF"}, {"face": [458, 436, 434, 460], "color": "#0000FF"}, {"face": [435, 437, 455, 457], "color": "#0000FF"}, {"face": [456, 438, 436, 458], "color": "#0000FF"}, {"face": [437, 439, 453, 455], "color": "#0000FF"}, {"face": [454, 440, 438, 456], "color": "#0000FF"}, {"face": [439, 417, 473, 453], "color": "#0000FF"}, {"face": [474, 418, 440, 454], "color": "#0000FF"}, {"face": [427, 415, 475, 463], "color": "#0000FF"}, {"face": [476, 416, 428, 464], "color": "#0000FF"}, {"face": [425, 427, 463, 465], "color": "#0000FF"}, {"face": [464, 428, 426, 466], "color": "#0000FF"}, {"face": [423, 425, 465, 467], "color": "#0000FF"}, {"face": [466, 426, 424, 468], "color": "#0000FF"}, {"face": [421, 423, 467, 469], "color": "#0000FF"}, {"face": [468, 424, 422, 470], "color": "#0000FF"}, {"face": [419, 421, 469, 471], "color": "#0000FF"}, {"face": [470, 422, 420, 472], "color": "#0000FF"}, {"face": [417, 419, 471, 473], "color": "#0000FF"}, {"face": [472, 420, 418, 474], "color": "#0000FF"}, {"face": [457, 455, 479, 477], "color": "#0000FF"}, {"face": [480, 456, 458, 478], "color": "#0000FF"}, {"face": [477, 479, 481, 483], "color": "#0000FF"}, {"face": [482, 480, 478, 484], "color": "#0000FF"}, {"face": [483, 481, 487, 485], "color": "#0000FF"}, {"face": [488, 482, 484, 486], "color": "#0000FF"}, {"face": [485, 487, 489, 491], "color": "#0000FF"}, {"face": [490, 488, 486, 492], "color": "#0000FF"}, {"face": [463, 475, 485, 491], "color": "#0000FF"}, {"face": [486, 476, 464, 492], "color": "#0000FF"}, {"face": [451, 483, 485, 475], "color": "#0000FF"}, {"face": [486, 484, 452, 476], "color": "#0000FF"}, {"face": [451, 461, 477, 483], "color": "#0000FF"}, {"face": [478, 462, 452, 484], "color": "#0000FF"}, {"face": [457, 477, 461, 459], "color": "#0000FF"}, {"face": [462, 478, 458, 460], "color": "#0000FF"}, {"face": [453, 473, 479, 455], "color": "#0000FF"}, {"face": [480, 474, 454, 456], "color": "#0000FF"}, {"face": [471, 481, 479, 473], "color": "#0000FF"}, {"face": [480, 482, 472, 474], "color": "#0000FF"}, {"face": [469, 487, 481, 471], "color": "#0000FF"}, {"face": [482, 488, 470, 472], "color": "#0000FF"}, {"face": [467, 489, 487, 469], "color": "#0000FF"}, {"face": [488, 490, 468, 470], "color": "#0000FF"}, {"face": [465, 491, 489, 467], "color": "#0000FF"}, {"face": [490, 492, 466, 468], "color": "#0000FF"}, {"face": [463, 491, 465], "color": "#0000FF"}, {"face": [466, 492, 464], "color": "#0000FF"}, {"face": [391, 389, 503, 501], "color": "#0000FF"}, {"face": [504, 390, 392, 502], "color": "#0000FF"}, {"face": [393, 391, 501, 499], "color": "#0000FF"}, {"face": [502, 392, 394, 500], "color": "#0000FF"}, {"face": [395, 393, 499, 497], "color": "#0000FF"}, {"face": [500, 394, 396, 498], "color": "#0000FF"}, {"face": [397, 395, 497, 495], "color": "#0000FF"}, {"face": [498, 396, 398, 496], "color": "#0000FF"}, {"face": [399, 397, 495, 493], "color": "#0000FF"}, {"face": [496, 398, 400, 494], "color": "#0000FF"}, {"face": [387, 399, 493, 505], "color": "#0000FF"}, {"face": [494, 400, 388, 506], "color": "#0000FF"}, {"face": [493, 501, 503, 505], "color": "#0000FF"}, {"face": [504, 502, 494, 506], "color": "#0000FF"}, {"face": [493, 495, 499, 501], "color": "#0000FF"}, {"face": [500, 496, 494, 502], "color": "#0000FF"}, {"face": [495, 497, 499], "color": "#0000FF"}, {"face": [500, 498, 496], "color": "#0000FF"}, {"face": [313, 381, 387, 505], "color": "#0000FF"}, {"face": [388, 382, 314, 506], "color": "#0000FF"}, {"face": [313, 505, 503, 321], "color": "#0000FF"}, {"face": [504, 506, 314, 322], "color": "#0000FF"}, {"face": [319, 321, 503, 389], "color": "#0000FF"}, {"face": [504, 322, 320, 390], "color": "#0000FF"}], "color": "#000000"}]//[cube1, cube2]
  return geom
}

updateScreen()