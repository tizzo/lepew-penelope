module.exports = function(data) {
  if (!data.hasOwnProperty('command')) {
    return false;
  }
  if (data.hasOwnProperty('args') && !(data.args instanceof Array)) {
    return false;
  }
  if (data.hasOwnProperty('options') && data.options instanceof Array) {
    return false;
  }
  if (data.hasOwnProperty('options') && typeof data.options !== 'object') {
    return false;
  }
  var keys = Object.keys(data);
  var i = 0;
  for (i in keys) {
    if (['command', 'args', 'options'].indexOf(keys[i]) === -1) {
      return false;
    }
  }
  return true;
};
