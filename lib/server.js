var package = require('../package');
var util = require('util');
var restify = require('restify');

module.exports = function(penelope, config) {

  var server = restify.createServer({
    name: package.name,
    version: package.version
  });
  server.use(restify.acceptParser(server.acceptable));
  server.use(restify.queryParser());
  server.use(restify.bodyParser());

  server.get('/', function(req, res, next) {
    res.send({
      name: package.name,
      version: package.version
    });
    return next();
  });

  server.get('/running-processes', function(req, res, next) {
    var output = {};
    var configs = penelope.getConfigs();
    var name = null;
    for (name in penelope.getChildren()) {
      output[name] = configs[name];
    }
    res.send(output);
    return next();
  });

  server.listen(config.port, function() {
    var message = {
      message: util.format('%s listening at %s', server.name, server.url)
    };
    console.log(JSON.stringify(message));
  });

  if (!config.keepAlive) {
    penelope.on('allProcessesClosed', function() {
      var message = {message: 'All processes closed, server stopping'};
      console.log(JSON.stringify(message));
      server.close(function() {
        var message = {message: 'Server exiting gracefully.'};
        console.log(JSON.stringify(message));
      });
    });
  }

  return server;
};
