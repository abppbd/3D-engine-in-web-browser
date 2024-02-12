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
var moveZ = 3 // up/down.

var p_alpha = 0 // Player alpha angle (+right / -left).
var p_beta = 0  // Player beta angle (+:up / -:down).

var rotAlpha = 1 // Player alpha angle step.
var rotBeta = 1  // Player beta angle step.

var H_FOV = 90       // Horizontal Field Of View.
var screenDist = 179 //FOVtoDist(H_FOV, canvas_w) // Dist screen to player/cam.
var camPlaneClip = 3 // Min dist from cam for rendering.

const pos_decimals = 3 // Nb of decimals for position precision.
const rot_decimals = 3 // Nb of decimals for rotation precision.

const toRender = loadJSON()
/*const geometryFile = "file:///C:/Users/lucamorriello/Documents/3Dengine/js/geometry.json"
var json = "placeholder"
// https://stackoverflow.com/a/14446538
*/


function clearCanvas(){
  ctx.clearRect(0, 0, canvas_w, canvas_h)
}


function compensateFlipScreen(x, y){
  // Screen's (0,0) if the top left so increase in y lowers a point on screen.
  return [point[0], -point[1]]
}


function drawLine(x1, y1, x2, y2, center=false, color="#000000"){

  // Screen (0, 0) is canvas top left corner.
  let balanceX = 0
  let balanceY = 0
  if (center){
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
  //console.log(x,y)
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


// "p" are arrays of 2 elements (x, y).
function drawTriangle(p1, p2, p3){
  drawLine(p1[0], p1[1], p2[0], p2[1])
  drawLine(p2[0], p2[1], p3[0], p3[1])
  drawLine(p3[0], p3[1], p1[0], p1[1])
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


// returns coords relative to cam (cancel, pos & rotation offsets)
function relToCam(point){ // point: (x, y, z)
  
  // cancel cam's translation
  let transX = point[0] - cam_x
  let transY = point[1] - cam_y
  let transZ = point[2] - cam_z
  let local_pos = [transX, transY, transZ]

  // cancel alpha cam rotation (yaw, z axis)
  let alphaCancel = rotateEuler(local_pos, -p_alpha, 2)

  //cancel beta cam rotation (pitch, y axis)
  let local_pos_dir = rotateEuler(alphaCancel, p_beta, 1)

  return local_pos_dir
}


// Project 3D point onto the screen. (canvas center is 0,0)
function perspectiveProj(point, conpensateSign=true, debug = false){ // point = [x, y, z]
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


// Check if a point is in front of the camera. (use after applying relToCam)
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


// Render vertecies.
function renderPoints(geometry){
  for (const shapeIdx in geometry) {
    // Loop over every shape.

    if (geometry[shapeIdx]["mode"].includes("p")){
      // If the shape has point mode active.

      let shape = geometry[shapeIdx]
      //console.log(shape)

      //let vertIdx = 0
      for (const vertIdx in shape["points"]) {
        // Loop over every vertex and generate their index.

        // Get local vertex coordinates. (relative to the sape's origin)
        let localPoint = shape["points"][vertIdx]["point"]

        // Get vertex pos in global space by adding shape's pos to the vertex.
        let globalPoint = shape["position"].map(function (axis, idx){
          return shape["points"][vertIdx]["point"][idx] + axis
        })

        // Set coords relative to cam.
        let relPoint = relToCam(globalPoint)
        //console.log("dawing vertex at", globalPoint, "rel to cam", relPoint, "w/ color", shape["points"][vertIdx]["color"])

        if (isInFront(relPoint)){ // If point is not behind cam.
          // Project on screen.
          let screenImg = perspectiveProj(relPoint)

          // Get dist from cam to vertex.
          let dist = distPoints([cam_x, cam_y, cam_z], relPoint)

          // Get size from dist, clamped between 1 and 20.
          let size = Math.max(20 - dist, 1)

          // Get point color (black if none given).
          let color = "#000000"
          if ("color" in shape["points"][vertIdx]){
            color = shape["points"][vertIdx]["color"]
          }

          // Render Vertex.
          drawPoint(screenImg[0], screenImg[1], radius=4, color)
        }
      }
    }
  }
  return
}


// Render edges.
function renderEdges(geometry){
  for (const shapeIdx in geometry){
    // Loop over every shape.

    if (geometry[shapeIdx]["mode"].includes("e")){
      // If the shape has edge mode active.

      let shape = geometry[shapeIdx]
      for (edgeIdx in shape["edges"]){
        // Loop over every edges and generate their index.

        // Get the edge's veticies index.
        let p1 = shape["edges"][edgeIdx]["edge"][0]
        let p2 = shape["edges"][edgeIdx]["edge"][1]

        // Get vertex pos in global space by adding shape's pos to the vertex's.
        let p1Global = shape["position"].map(function (axis, idx){
          return shape["points"][p1]["point"][idx] + axis
        })
        let p2Global = shape["position"].map(function (axis, idx){
          return shape["points"][p2]["point"][idx] + axis
        })

        // Set coords relative to cam.
        let p1Rel = relToCam(p1Global)
        let p2Rel = relToCam(p2Global)

        if ((isInFront(p1Rel) || isInFront(p2Rel))){
          // If one of the points is not behind cam.

          // Project on screen.
          let p1Screen = perspectiveProj(p1Rel, conpensateSign=true, debug=false)
          let p2Screen = perspectiveProj(p2Rel, conpensateSign=true, debug=false)

          // Get point color (black if none given).
          let color = "#000000"
          if ("color" in shape["edges"][edgeIdx]){
            color = shape["edges"][edgeIdx]["color"]
          }

          drawLine(p1Screen[0], p1Screen[1], p2Screen[0], p2Screen[1], true, color)
        }
      }
    }
  }
  return
}


function updateScreen(){
  clearCanvas()
  renderPoints(toRender)
  renderEdges(toRender)
  drawBorder()
  drawPoint(0, 0, 5) // Draw crossair in canvas' center.
}


/*
// Update the screen (not cleared).
function screenUpdate(){
  let point = [2, 0, 0]

  // get point rel to camera
  let localPoint = relToCam(point)

  // project point to screen
  let screenPoint = perspectiveProj(localPoint)

  if (localPoint[0] > 0){
    // render only if in front
    drawPoint(screenPoint[0], screenPoint[1], 10)
  }
  console.log(localPoint, screenPoint)
  return
}
*/


drawBorder()
drawPoint(0, 0, 5) // draw canvas' center


function loadJSON(){
  let cube1 = {
    "Id" : 0,
    "name" : "cube",
    "mode" : "pe",
    "isRendered" : true,
    "position" : [0, 0, 0],
    "rotation" : [0, 0],
    "points" : [
      {"point" : [5,5,5],
       "color" : "#F00000"},
      {"point" : [5,-5,5],
       "color" : "#0F0000"},
      {"point" : [5,-5,-5],
        "color" : "#00F000"},
      {"point" : [5,5,-5],
       "color" : "#000F00"},
      {"point" : [-5,5,5],
       "color" : "#F000FF"},
      {"point" : [-5,-5,5],
       "color" : "#0F00FF"},
      {"point" : [-5,-5,-5],
       "color" : "#00F0FF"},
      {"point" : [-5,5,-5],
       "color" : "#000FFF"}
    ],

    "edges" : [
      {"edge" : [0,1],
       "color" : "#00FF00"},
      {"edge" : [1,2],
       "color" : "#00FF00"},
      {"edge" : [2,3],
       "color" : "#00FF00"},
      {"edge" : [3,0],
       "color" : "#00FF00"},
      {"edge" : [4,5],
       "color" : "#00FF00"},
      {"edge" : [5,6],
       "color" : "#00FF00"},
      {"edge" : [6,7],
       "color" : "#00FF00"},
      {"edge" : [7,4], // special.
       "color" : "#FFFF00"},
      {"edge" : [0,4],
       "color" : "#00FF00"},
      {"edge" : [1,5],
       "color" : "#00FF00"},
      {"edge" : [2,6],
       "color" : "#00FF00"},
      {"edge" : [3,7],
       "color" : "#00FF00"}
    ],

    "faces" : [
      {"front1" : [0, 1, 2], // Front face (+x)
       "color" : "#0000FF"},
      {"front2" : [2, 3, 0],
       "color" : "#0000FF"},
      {"back1" : [4, 5, 6], // Back face (-x)
       "color" : "#00FF00"},
      {"back2" : [6, 7, 4],
       "color" : "#00FF00"},
      {"top1" : [0, 1, 5], // Top face (+z)
       "color" : "#FF0000"},
      {"top2" : [5, 4, 0],
       "color" : "#FF0000"},
      {"left1" : [1, 2, 5], // Left face (-y)
       "color" : "#00FFFF"},
      {"left2" : [5, 6, 1],
       "color" : "#00FFFF"},
      {"right1" : [0, 4, 3], // Right face (+y)
       "color" : "#FFFF00"},
      {"right2" : [3, 7, 4],
       "color" : "#FFFF00"},
      {"bottom1" : [2, 3, 7], // Bottom face (-Z)
       "color" : "#FF00FF"},
      {"bottom2" : [7, 6, 2],
       "color" : "#FF00FF"}
    ]
  }

  let cube2 = Object.assign({},cube1) // Make a copy of cube1.
  cube2["position"] = [10, 0, 0]      // Change cube2's pos.

  console.log(cube1)
  console.log(cube2)

  let fullGeom = [cube1, cube2]
  return fullGeom
}


renderPoints(toRender)
renderEdges(toRender)