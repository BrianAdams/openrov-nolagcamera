/*
 *
 * Description:
 * Configuration file.  Manage frame rate, port, etc.
 *
 */
var CONFIG = require('nconf');

//Add your Mock objects here using this same naming convention of library-mock for the mock version.
//be sure to add it to the expoft at the bottom of this file as well.
var OpenROVCameraPath = 'nolagcamera-controller';

// Will essentially rewrite the file when a change to the defaults are made if there is a parsing error.
try {
  CONFIG.use('file', { file: './etc/nolagcameraconfig.json' });
} catch (err) {
  console.log('Unable to load the configuration file, resetting to defaults');
  console.log(err);
}

CONFIG.env(); //Also look for overrides in environment settings

// Do not change these values in this file for an individual ROV, use the ./etc/rovconfig.json instead

CONFIG.defaults({
  'video_frame_rate': 10,
  'video_resolution': 'SXGA',
  'video_device': '/dev/video0',
  'video_port': 8090,
  'USE_MOCK' : false
});


var getLibPath = function (lib) {
  var result = lib;
  if (CONFIG.get('USE_MOCK') === 'true') {
    result += '-mock';
  }
  return result;
};


CONFIG.set('OpenROVCameraPath',getLibPath(OpenROVCameraPath));

module.exports = CONFIG;
console.log('config', module.exports);
