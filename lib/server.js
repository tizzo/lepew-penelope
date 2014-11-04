var package = require('../package');
var util = require('util');
var restify = require('restify');
var es = require('event-stream');

module.exports = function(penelope, config, done) {

  /* istanbul ignore next */
  var log = config.log || console.log;

  var server = restify.createServer({
    name: package.name,
    version: package.version
  });
  server.use(restify.acceptParser(server.acceptable));
  server.use(restify.queryParser());
  server.use(restify.bodyParser());
  server.killProcessTimeout = 3000;

  server.get('/', function(req, res, next) {
    res.send({
      name: package.name,
      version: package.version
    });
    return next();
  });

  server.get('/log', function(req, res, next) {
    res.writeHead(200);
    penelope.eventStream
      .pipe(es.stringify())
      .pipe(res);
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
    }
    var closeListener = function() {
      res.send({message: util.format('Process `%s` stopped', name)});
    }
    var timeout = setTimeout(function() {
      penelope.removeListener('processClosed:' + name, closeListener);
      res.writeHead(500);
      res.end(JSON.stringify({message: 'Process failed to close.'}));
    }, this.killProcessTimeout);
    penelope.once('processClosed:' + name, closeListener);
    children[name].kill();
  });

  server.post('/running-processes/:name', function(req, res, next) {
    if (!req.params.command) {
      res.writeHead(400);
      res.end();
    }
    var args = req.params.args || [];
    penelope.runCommand(req.params.name, req.params.command, args);
    res.send({message: util.format('Process `%s` started', req.params.name)});
  });

  server.put('/running-processes/:name', function(req, res, next) {
    var name = req.params.name;
    var config = null
    if (config = penelope.getConfig(name)) {
      console.log('doing stuff', config);
      penelope.runCommand(config.name, config.command, config.args);
      res.writeHead(201);
      res.end();
      return;
    }
    res.writeHead(404);
    res.end();
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

  server.on('close', function() {
    var message = {message: 'Server successfully shutdown'};
    log(JSON.stringify(message));
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
