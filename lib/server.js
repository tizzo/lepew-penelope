var package = require('../package');
var util = require('util');
var restify = require('restify');

module.exports = function(penelope, config, done) {
  var log = config.log || console.log;

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
    var configs = penelope.getConfig();
    var name = null;
    for (name in penelope.getChildren()) {
      output[name] = configs[name];
    }
    res.send(output);
    return next();
  });

  server.del('/running-processes/:name', function(req, res, next) {
    var children = penelope.getChildren();
    var name = req.params.name;
    if (!children[name]) {
      res.writeHead(404);
      return res.end();
      //return res.send({message: 'Resource not found.'});
    }
    children[name].kill();
    res.send({message: 'Kill message sent'});
  });

  server.post('/running-processes/:name', function(req, res, next) {
  });

  server.listen(config.port, function() {
    var message = {
      message: util.format('%s listening at %s', server.name, server.url)
    };
    log(JSON.stringify(message));
    if (done) {
      done();
    }
  });

  if (!config.keepAlive) {
    penelope.on('allProcessesClosed', function() {
      var message = {message: 'All processes closed, server stopping'};
      log(JSON.stringify(message));
      server.close(function() {
        var message = {message: 'Server exiting gracefully.'};
        log(JSON.stringify(message));
      });
    });

  }

  return server;
};
