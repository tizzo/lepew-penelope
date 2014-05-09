var es = require('event-stream');

module.exports = function filter(options) {
  return es.through(function(data) {
    var option = null;
    var match = false;
    for (option in options) {
      if (data.hasOwnProperty(option) && data[option] == options[option]) {
        match = true;
      }
    }
    if (match) {
      this.emit('data', data);
    }
  });
};
