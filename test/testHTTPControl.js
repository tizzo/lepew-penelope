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
};

util.inherits(Penelope, EventEmitter);

Penelope.prototype.getConfig = function(name) {
  var configs = {
    'foo': {
      name: "test/fixtures/beeper.js",
      args: [
        "--a",
        "-b",
        "c"
      ]
    }
  };
  return configs;
};

Penelope.prototype.getChildren = function() {
  return {
    'foo': {}
  };
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
    ], function(error, results) {
      ports['version'] = results[0];
      ports['running'] = results[1];
      done();
    });
  });
  it('should report the version number', function(done) {
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
  it('should list the running processes', function(done) {
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


