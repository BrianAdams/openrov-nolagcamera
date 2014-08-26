/*
 *
 * Description:
 * This script is the Node.js server for OpenROV.  It creates a server and instantiates an OpenROV
 * and sets the interval to grab frames.  The interval is set with the DELAY variable which is in
 * milliseconds.
 *
 */
var CONFIG = require('config'),
  fs = require('fs'),
  express = require('express'),
  app = express(),
  server = require('http').createServer(app),
  io = require('socket.io').listen(server),
  EventEmitter = require('events').EventEmitter,
  Camera = require(CONFIG.NoLagCamera),
  logger = require('logger').create(CONFIG),
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
// setup required directories
process.env.NODE_ENV = true;
var globalEventLoop = new EventEmitter();
var DELAY = Math.round(1000 / CONFIG.video_frame_rate);
var camera = new Camera({ delay: DELAY });

app.get('/config.js', function (req, res) {
  res.type('application/javascript');
  res.send('var CONFIG = ' + JSON.stringify(CONFIG));
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
  if (connections == 1)
    controller.start();
  socket.send('initialize');
  // opens socket with client
  if (camera.IsCapturing) {
    socket.emit('videoStarted');
    console.log('Send videoStarted to client 2');
  } else {
    console.log('Trying to restart mjpeg streamer');
    camera.capture();
    socket.emit('videoStarted');
  }
  socket.on('ping', function (id) {
    socket.emit('pong', id);
  });
  socket.on('update_settings', function (value) {
    for (var property in value)
      if (value.hasOwnProperty(property))
        CONFIG.preferences.set(property, value[property]);

    CONFIG.savePreferences();
    controller.updateSetting();
    setTimeout(function () {
      controller.requestSettings();
    }, 1000);
  });
  socket.on('disconnect', function () {
    connections -= 1;
    console.log('disconnect detected');
    if (connections === 0)
      controller.stop();
  });
  globalEventLoop.on('videoStarted', function () {
    socket.emit('videoStarted');
    console.log('sent videoStarted to client');
  });
  globalEventLoop.on('videoStopped', function () {
    socket.emit('videoStopped');
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
    return console.error('couldn\'t initialize camera. got:', err);
  }
});
camera.on('error.device', function (err) {
  console.log('camera emitted an error:', err);
  globalEventLoop.emit('videoStopped');
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
server.listen(app.get('port'), function () {
  console.log('Started listening on port: ' + app.get('port'));
});
