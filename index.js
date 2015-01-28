'use strict';

var vec3 = require('gl-vec3')
, extend = require('extend')


module.exports = function(game, opts, control_state) {
  return new FPSController(game, opts, control_state)
}


var _game
, twopi =  Math.PI * 2
, halfpi = Math.PI / 2

var defaults = {
  maxSpeed: 7
  , moveForce: 25
  , responsiveness: 20
  , runningFriction: 0
  , standingFriction: 20

  , airMoveMult: 0.3
  , jumpImpulse: 8
  , jumpForce: 11
  , jumpTime: 350 // ms
  , airJumps: 1

  , crouchMoveMult: 0.6
  , sprintMoveMult: 1.3
  , inverseY: true
  , rotationScale: 0.005
}


/* 
 *    CONSTRUCTOR - the controller
*/
function FPSController(game, opts) {
  _game = game
  this._target = null
  this._camera = null

  // inputs - abstract this later?
  this.state = _game.buttons

  // engine setup
  opts = extend( {}, defaults, opts )
  this.moveForce      = opts.moveForce
  this.responsiveness = opts.responsiveness
  this.jumpImpulse    = opts.jumpImpulse
  this.jumpForce      = opts.jumpForce
  this.jumpTime       = opts.jumpTime
  this.airJumps       = opts.airJumps
  this.airMoveMult    = opts.airMoveMult
  this.crouchMoveMult = opts.crouchMoveMult
  this.sprintMoveMult = opts.sprintMoveMult
  this.inverseY       = opts.inverseY
  this.rotationScale  = opts.rotationScale
  this.standingFriction = opts.standingFriction
  this.runningFriction = opts.runningFriction
  this.maxSpeed       = opts.maxSpeed
  
  this._jumping = false
  this._airjumps = 0
  this._currjumptime = 0
}



var proto = FPSController.prototype

proto.setTarget = function(target) {
  if(target) this._target = target
  return this._target
}

proto.setCamera = function(camera) {
  if(camera) this._camera = camera
  return this._camera
}




var state, target, onGround
, dx, dy, rotX, rotY, speed
, m    = vec3.create()
, push = vec3.create()
, pushLen, canPush, pushAmt


proto.tick = function(dt) {
  if(!this._target || !this._camera) return

  state = this.state
  target = this._target
  onGround = (target.atRestY() < 0)


  // Rotation: translate dx/dy inputs into y/x axis camera angle changes
  dx = this.rotationScale * state.dy * ((this.inverseY) ? -1 : 1)
  dy = this.rotationScale * state.dx
  // normalize/clamp/update
  rotX = clamp( this._camera.rotationX + dx, halfpi )
  rotY = (this._camera.rotationY + dy) % twopi
  this._camera.rotationX = rotX
  this._camera.rotationY = rotY

  // jumping
  var canjump = (onGround || this._airjumps < this.airJumps)
  if (onGround) {
    this._jumping = false
    this._airjumps = 0
  }
  if (state.jump) {
    if (this._jumping) { // continue previous jump
      if (this._currjumptime > 0) {
        var jf = this.jumpForce
        if (this._currjumptime < dt) jf *= this._currjumptime/dt
        target.applyForce( [0, jf, 0] )
        this._currjumptime -= dt
      }
    } else if (canjump) { // start new jump
      this._jumping = true
      if (!onGround) this._airjumps++
      this._currjumptime = this.jumpTime
      target.applyImpulse( [0, this.jumpImpulse, 0] )
      // clear downward velocity on airjump
      if (!onGround && target.velocity[1]<0) target.velocity[1] = 0
    }
  } else {
    this._jumping = false
  }

  // Movement: determine local direction of desired movement
  vec3.set( m, 0, 0, 0 )
  if (state.backward) m[2] += 1
  if (state.forward)  m[2] -= 1
  if (state.right)    m[0] += 1
  if (state.left)     m[0] -= 1
  vec3.normalize( m, m )

  if (m[0] !== 0 || m[2] !== 0) {
    // convert to world coords and scale to desired movement vector
    vec3.rotateY( m, m, [0,0,0], -rotY )
    speed = this.maxSpeed
    if (state.sprint)  speed *= this.sprintMoveMult
    if (state.crouch)  speed *= this.crouchMoveMult
    vec3.scale( m, m, speed )

    // push vector to achieve desired speed & dir
    // following code to adjust 2D velocity to desired amount is patterned on Quake: 
    // https://github.com/id-Software/Quake-III-Arena/blob/master/code/game/bg_pmove.c#L275
    vec3.subtract( push, m, target.velocity )
    push[1] = 0
    pushLen = vec3.length(push)
    vec3.normalize(push, push)

    if (pushLen > 0) {
      // pushing force vector
      canPush = this.moveForce
      if (!onGround)  canPush *= this.airMoveMult

      // apply final force
      pushAmt = this.responsiveness * pushLen
      if (canPush > pushAmt) canPush = pushAmt

      vec3.scale( push, push, canPush )
      target.applyForce( push )

    }

    // different friction when not moving
    // idea from Sonic: http://info.sonicretro.org/SPG:Running
    target.friction = this.runningFriction
  } else {
    target.friction = this.standingFriction
  }

  // handle firing - haven't looked at this yet
  var can_fire = true

  if(state.fire || state.firealt) {
    if(this.firing && this.needs_discrete_fire) {
      this.firing += dt
    } else {
      if(!this.fire_rate || 
         Math.floor(this.firing / this.fire_rate) !== Math.floor((this.firing + dt) / this.fire_rate)) {
        this.onfire(state)
      }
      this.firing += dt
    }
  } else {
    this.firing = 0
  }

}





proto.onfire = function(_) {

}

function clamp(value, to) {
  return isFinite(to) ? Math.max(Math.min(value, to), -to) : value
}