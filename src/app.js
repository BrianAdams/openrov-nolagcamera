var forever = require('forever-monitor');
var child = new forever.Monitor('/opt/openrov/nolagcamera/src/nolagcamera.js', {
    max: 3,
    silent: process.env.NODE_DEBUG === 'false',
    options: [],
    'logFile': '/var/log/nolagcamera.log',
    'outFile': '/var/log/nolagcamera.log',
    'errFile': '/var/log/nolagcamera.log'
  });
child.on('exit', function () {
  console.log('nolagcamera.js has exited after 3 restarts');
});
child.on('exit:code', function(err){
    console.log('detected error');
    if (err==17){  //Graceful restarts of the app need to process.exit(17)
        console.log('detected intentional restart');
        child.times+=-1;
    }
});
if (process.platform === 'linux') {
  process.on('SIGTERM', function () {
    console.error('got SIGTERM, shutting down...');
    child.stop();
  });
  process.on('SIGINT', function () {
    console.error('got SIGINT, shutting down...');
    child.stop();
  });
}
child.start();
