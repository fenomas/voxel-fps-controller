# voxel-fps-controller
FPS-style movement/camera controller for my experimental branch of voxeljs.

This module abstracts the connection between inputs and 
player/camera movement. It takes a state object full of truthy values 
representing inputs (`forward`, `jump`, etc.), and manipulates a rigid body 
in the physics engine (such as [this one](https://github.com/andyhall/voxel-physics-engine)). 
It also consumes `dx`, `dy` values from the state object and controls 
a camera, via passed-in accessor functions.

The module was made to work with voxeljs, but doesn't take references
to any core parts of the engine, and can be used with other game engines,
such as [noa-hello-world](https://github.com/andyhall/noa-hello-world).

(For voxel.js, this module conceptually sort of combines (and is based on) 
[game-shell-fps-camera](https://github.com/deathcap/game-shell-fps-camera),
and [voxel-controls](https://github.com/deathcap/voxel-controls),
bit it removes the stream-like behavior, and depends on a more 
general kind of physics engine.)