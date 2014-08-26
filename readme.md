OpenROV No Lag Camera Project
=========

This is a project to expose an internet accessible video feed with as little latency as possible that can be
consumed in a modern browser without need for a plugin.

The current project exposes a local camera on the system as a mjpeg stream that can be viewed in the browser
by just referencing the stream's url as the source for an img tag.

Behind the scenes the system is currently wrapping the mjpeg-streamer library with a service that handles
configuration and monitoring of the running service.

The project current targets the linux platform



Installation
----------

Prerequisites:
* mjpeg-streamer

`npm install openrov-nolagcamera
