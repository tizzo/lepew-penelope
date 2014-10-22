var should = require('should'),
  request = require('request'),
  portfinder = require('portfinder'),
  async = require('async'),
  util = require('util'),
  EventEmitter = require('events').EventEmitter,
  createServer = require('../lib/server');

var Penelope = function() {
  this.name = 'penelope';
  this.version = '1.0.0';
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
      portfinder.getPort
    ], function(error, results) {
      ports['version'] = results[0];
      ports['running'] = results[1];
      ports['delete good'] = results[2];
      ports['delete bad'] = results[3];
      ports['keep alive on'] = results[4];
      ports['keep alive off'] = results[5];
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
          body.version.should.equal('0.0.3');
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
  });
  describe('DELETE', function() {
    it('should kill a process when a DELETE is sent to `/running-process/:name`', function(done) {
      config.port = ports['delete good'];
      var penelope = new Penelope();
      var server = createServer(penelope, config, function() {
        penelope.setChild('scratchy', {
          kill: function() {
            server.close(function() {
              done();
            });
          }
        });
        request.del('http://localhost:' + ports['delete good'] + '/running-processes/scratchy', function (error, response, body) {
          JSON.parse(body).message.should.equal('Kill message sent');
        });
      });
    });
    it('should error when a DELETE is sent for a nonexistant name', function(done) {
      config.port = ports['delete bad'];
      var penelope = new Penelope();
      var server = createServer(penelope, config, function() {
        request.del('http://localhost:' + ports['delete bad'] + '/running-processes/itchy', function (error, response, body) {
          response.statusCode.should.equal(404);
          done();
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
            console.log('a');
            done();
          });
        }, 5)
      });
    });
  });
});


