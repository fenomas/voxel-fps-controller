# voxel-fps-controller
FPS-style movement/camera controller for my experimental branch of voxeljs.

This module abstracts the connection between inputs and 
player/camera movement. It takes a stream of inputs 
(`jump`, `dx`, etc.), and manipulates a rigid body 
in the physics engine and a `basic-camera` instance.

Conceptually the module sort of combines (and is based on) 
[game-shell-fps-camera](https://github.com/deathcap/game-shell-fps-camera),
and [voxel-controls](https://github.com/deathcap/voxel-controls),
bit it removes the stream-like behavior, and depends on a more 
general kind of physics engine.