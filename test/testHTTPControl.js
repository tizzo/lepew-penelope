var should = require('should'),
  request = require('request'),
  portfinder = require('portfinder'),
  async = require('async'),
  util = require('util'),
  es = require('event-stream'),
  Readable = require('stream').Readable,
  EventEmitter = require('events').EventEmitter,
  createServer = require('../lib/server');

var Penelope = function() {
  var _this = this;
  this.name = 'penelope';
  this.version = '1.0.0';
  this.eventStream = new es.through(function(data) {
    this.emit('data', data);
  });
  this.configs = {
    'foo': {
      name: "test/fixtures/beeper.js",
      args: [
        "--a",
        "-b",
        "c"
      ]
    }
  };
  this.children = {
    'foo': {}
  };
};

util.inherits(Penelope, EventEmitter);

Penelope.prototype.setChild = function(name, child) {
  this.children[name] = child;
};
Penelope.prototype.getConfig = function(name) {
  return this.configs;
};

Penelope.prototype.getChildren = function() {
  return this.children;
};

var config = {
  keepAlive: true,
  log: function() {}
};
var ports = {};

describe('HTTP server', function() {
  before(function(done) {
    async.parallel([
      portfinder.getPort,
      portfinder.getPort,
      portfinder.getPort,
      portfinder.getPort,
      portfinder.getPort,
      portfinder.getPort,
      portfinder.getPort,
      portfinder.getPort,
      portfinder.getPort,
      portfinder.getPort,
      portfinder.getPort
    ], function(error, results) {
      ports['version'] = results[0];
      ports['running'] = results[1];
      ports['running single'] = results[2];
      ports['log'] = results[3];
      ports['delete good'] = results[4];
      ports['delete bad nonexistant'] = results[5];
      ports['delete bad timeout'] = results[6];
      ports['keep alive on'] = results[7];
      ports['keep alive off'] = results[8];
      ports['post good'] = results[9];
      ports['post bad incomplete'] = results[10];
      done();
    });
  });
  describe('GET', function() {
    it('should report the version number at `/`', function(done) {
      config.port = ports['version'];
      var server = createServer(new Penelope, config, function() {
        request('http://localhost:' + ports['version'], function (error, response, body) {
          body = JSON.parse(body);
          body.name.should.equal('lepew-penelope');
          body.version.should.equal(require('../package.json').version);
          server.close(function() {
            done();
          });
        });
      });
    });
    it('should list the running processes at `/running-processes`', function(done) {
      config.port = ports['running'];
      var server = createServer(new Penelope, config, function() {
        request('http://localhost:' + ports['running'] + '/running-processes', function (error, response, body) {
          body = JSON.parse(body);
          Object.keys(body).length.should.equal(1);
          body.foo.args.length.should.equal(3);
          server.close(function() {
            done();
          });
        });
      });
    });
    it('should list the logs at `/log`', function(done) {
      config.port = ports['log'];
      var penelope = new Penelope();
      var server = createServer(penelope, config, function() {
        var logStream = request('http://localhost:' + ports['log'] + '/log')
        logStream.pipe(es.through(function(data) {
            var output = JSON.parse(data.toString());
            output.name.should.equal('echo');
            output.stream.should.equal('stdout');
            done();
          }));
        // Wait for the client to connect, then emit a log event we can catch.
        setTimeout(function() {
          penelope.eventStream.write({
            name: 'echo',
            command: 'echo',
            stream: 'stdout',
            time: 1415766165449
          });
        }, 10);
      });
    });
  });
  describe('DELETE', function() {
    it('should kill a process when a DELETE is sent to `/running-process/:name`', function(done) {
      config.port = ports['delete good'];
      var penelope = new Penelope();
      var server = createServer(penelope, config, function() {
        penelope.setChild('scratchy', {
          kill: function() {
            penelope.emit('processClosed:scratchy');
            server.close();
          }
        });
        request.del('http://localhost:' + ports['delete good'] + '/running-processes/scratchy', function (error, response, body) {
          JSON.parse(body).message.should.equal(util.format('Process `scratchy` stopped'));
          response.statusCode.should.equal(200);
          done(error);
        });
      });
    });
    it('should error when a DELETE is sent for a nonexistant name', function(done) {
      config.port = ports['delete bad nonexistant'];
      var penelope = new Penelope();
      var server = createServer(penelope, config, function() {
        request.del('http://localhost:' + ports['delete bad nonexistant'] + '/running-processes/itchy', function (error, response, body) {
          response.statusCode.should.equal(404);
          done();
        });
      });
    });
    it('should error when the process fails to exit.', function(done) {
      config.port = ports['delete bad timeout'];
      var penelope = new Penelope();
      var server = createServer(penelope, config, function() {
        server.killProcessTimeout = 100;
        penelope.setChild('scratchy', {
          kill: function() {}
        });
        request.del('http://localhost:' + ports['delete bad timeout'] + '/running-processes/scratchy', function (error, response, body) {
          server.close(function() {
            JSON.parse(body).message.should.equal('Process failed to close.');
            response.statusCode.should.equal(500);
            done(error);
          });
        });
      });
    });
  });
  describe('POST', function() {
    it('should issue an error if the request is incomplete', function(done) {
      var penelope = new Penelope();
      config.port = ports['post bad incomplete'];
      var options = {
        url: 'http://localhost:' + ports['post bad incomplete'] + '/running-processes/beeper',
        form: {}
      };
      var server = createServer(penelope, config, function() {
        request.post(options, function (error, response, body) {
          response.statusCode.should.equal(400);
          server.close(done);
        });
      });
    });
    it('should run a command when post is called with a valid request', function(done) {
      var penelope = new Penelope();
      var commandWasRun = false;
      penelope.runCommand = function() {
        commandWasRun = arguments;
      };
      config.port = ports['post good'];
      var options = {
        url: 'http://localhost:' + ports['post good'] + '/running-processes/beeper',
        form: {
          command: 'foo',
          args: ['-c']
        }
      };
      var server = createServer(penelope, config, function() {
        request.post(options, function (error, response, body) {
          commandWasRun[0].should.equal('beeper');
          commandWasRun[1].should.equal('foo');
          commandWasRun[2].length.should.equal(1);
          commandWasRun[2][0].should.equal('-c');
          response.statusCode.should.equal(200);
          server.close(done);
        });
      });
    });
  });
  describe('shutdown', function() {
    it('should kill the process when the last process exits if keepalive is off', function(done) {
      config.port = ports['keep alive off'];
      config.log = function(message) {
        if (JSON.parse(message).message == 'Server successfully shutdown') {
          done();
        }
      };
      config.keepAlive = false;
      var penelope = new Penelope();
      var server = createServer(penelope, config, function() {
        penelope.emit('allProcessesClosed');
      });
    });
    it('should not kill the process when the last process exits if keepalive is on', function(done) {
      config.port = ports['keep alive on'];
      // We use a timeout to detect if the server would have closed by itself
      // before we kill it.
      var timedOut = false;
      config.log = function(message) {
        if (!timedOut && JSON.parse(message).message == 'Server successfully shutdown') {
          done(new Error('Server shut down'));
        }
      };
      config.keepAlive = true;
      var penelope = new Penelope();
      var server = createServer(penelope, config, function() {
        penelope.emit('allProcessesClosed');
        setTimeout(function() {
          timedOut = true;
          server.close(function() {
            done();
          });
        }, 5)
      });
    });
  });
});


