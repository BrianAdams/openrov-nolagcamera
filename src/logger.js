function Logger(config) {
  this.log = function (params) {
    if (config.get('debug')) {
      console.log(params);
    }
  };
  this.command = function (params) {
    if (config.get('debug_commands')) {
      console.error('command', command);
    }
  };
}
Logger.create = function (config) {
  return new Logger(config);
};
module.exports = Logger;
