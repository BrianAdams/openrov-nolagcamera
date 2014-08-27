/*
 *
 * Description:
 * This script is the Node.js server for OpenROV.  It creates a server and instantiates an OpenROV
 * and sets the interval to grab frames.  The interval is set with the DELAY variable which is in
 * milliseconds.
 *
 */
var CONFIG = require('./config'),
  fs = require('fs'),
  express = require('express'),
  app = express(),
  server = require('http').createServer(app),
  io = require('socket.io').listen(server),
  EventEmitter = require('events').EventEmitter,
  Camera = require(CONFIG.get('OpenROVCameraPath')),
  path = require('path');

app.configure(function () {
  app.use(express.static(__dirname + '/static/'));
  app.use(express.json());
  app.use(express.urlencoded());
  app.set('port', CONFIG.port);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs', { pretty: true });
  app.use(express.favicon(__dirname + '/static/favicon.icon'));
  app.use(express.logger('dev'));
  app.use(app.router);
});

process.env.NODE_ENV = true;
var globalEventLoop = new EventEmitter();
var camera = new Camera(
  {
      device: CONFIG.get('mjpeg.video_device'),
      resolution: CONFIG.get('mjpeg.video_resolution'),
      framerate: CONFIG.get('mjpeg.video_frame_rate'),
      port: CONFIG.get('mjpeg.video_port')
  }
);

app.get('/config.js', function (req, res) {
  res.type('application/javascript');
  res.send('var CONFIG = ' + JSON.stringify(CONFIG.get()));
});
app.get('/', function (req, res) {
  res.render('index', {
    title: 'OpenROV NoLagCamera',
    scripts: scripts,
    styles: styles
  });
});
// no debug messages
io.configure(function () {
  io.set('log level', 1);
});

var connections = 0;
// SOCKET connection ==============================
io.sockets.on('connection', function (socket) {
  connections += 1;

  socket.on('ping', function (id) {
    socket.emit('pong', id);
  });

  socket.on('disconnect', function () {
    connections -= 1;
    console.log('disconnect detected');
  });

});

camera.on('started', function () {
  console.log('emitted \'videoStarted\'');
  globalEventLoop.emit('videoStarted');
});

camera.capture(function (err) {
  if (err) {
    connections -= 1;
    camera.close();
    console.error('couldn\'t initialize camera. got:', err);
    process.exit(-1);
  }
});

camera.on('error.device', function (err) {
  console.log('camera emitted an error:', err);
  globalEventLoop.emit('videoStopped');
  process.exit(err);
});

if (process.platform === 'linux') {
  process.on('SIGTERM', function () {
    console.error('got SIGTERM, shutting down...');
    camera.close();
    process.exit(0);
  });
  process.on('SIGINT', function () {
    console.error('got SIGINT, shutting down...');
    camera.close();
    process.exit(0);
  });
}

// Start the web server
server.listen(app.get('service.port'), function () {
  console.log('Started listening on port: ' + app.get('service.port'));
});
