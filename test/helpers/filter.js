var es = require('event-stream');

// Creates a through stream that filters events based on
// whether they match the simple criteria passed into the
// options array.
module.exports = function filter(options) {
  return es.through(function(data) {
    var option = null;
    var match = false;
    for (option in options) {
      if (data.hasOwnProperty(option) && data[option] == options[option]) {
        match = true;
      }
      else {
        return;
      }
    }
    if (match) {
      this.emit('data', data);
    }
  });
};
