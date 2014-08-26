/*
 *
 * Description:
 * This script creates a directory and sends that as an argument to a spawned process (capture.cpp).
 * Then, it sends a request to capture a frame with file name of current time at a given interval.
 * Lastly, when (capture.cpp) responds with the file name (meaning save completed), it reads the file
 * and then emits the content to the Node.js server in base64 (string) format.
 *
 */
var spawn = require('child_process').spawn,
 util = require('util'),
 EventEmitter = require('events').EventEmitter,
 fs = require('fs'),
 path = require('path'),
 CONFIG = require('./config'),
 logger = require('./logger').create(CONFIG);
var NoLagCamera = function (options) {
  var camera = new EventEmitter();
  var capture_process;
  // Open mjpg_streamer app as a child process
  var cmd = 'mjpg_streamer';
  // rename to correspond with your C++ compilation
  var default_opts = {
      device: CONFIG.get('video_device'),
      resolution: CONFIG.get('video_resolution'),
      framerate: CONFIG.get('video_frame_rate'),
      port: CONFIG.get('video_port');
    };
  options = default_opts;
  var _capturing = false;
  camera.IsCapturing = function () {
    return _capturing;
  };
  var args = [
      '-i',
      '/usr/local/lib/input_uvc.so -r ' + options.resolution + ' -f ' + options.framerate,
      '-o',
      '/usr/local/lib/output_http.so -p ' + options.port
    ];
  // End camera process gracefully
  camera.close = function () {
    if (!_capturing)
      return;
    logger.log('closing camera on', options.device);
    _capturing = false;
    logger.log('sending SIGHUP to capture process');
    process.kill(capture_process.pid, 'SIGHUP');
  };
  // Actual camera capture starting mjpg-stremer
  camera.capture = function (callback) {
    logger.log('initiating camera on', options.device);
    logger.log('ensure beagle is at 100% cpu for this camera');
    spawn('cpufreq-set', [
      '-g',
      'performance'
    ]);
    // if camera working, should be at options.device (most likely /dev/video0 or similar)
    fs.exists(options.device, function (exists) {
      // no camera?!
      if (!exists)
        return callback(new Error(options.device + ' does not exist'));
      // wooooo!  camera!
      logger.log(options.device, ' found');
      _capturing = true;
      // then remember that we're capturing
      logger.log('spawning capture process...');
      capture_process = spawn(cmd, args);
      camera.emit('started');
      capture_process.stdout.on('data', function (data) {
        logger.log('camera: ' + data);
      });
      capture_process.stderr.on('data', function (data) {
        logger.log('camera: ' + data);  //	camera.emit('error.device',data);
      });
      console.log('camera started');
      capture_process.on('exit', function (code) {
        console.log('child process exited with code ' + code);
        _capturing = false;
        camera.emit('error.device', code);
      });
    });
  };
  return camera;
};
module.exports = NoLagCamera;
