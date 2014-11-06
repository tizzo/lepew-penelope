var should = require('should'),
  Penelope = require('..'),
  es = require('event-stream'),
  path = require('path'),
  async = require('async'),
  http = require('http');

var filter = require('./helpers/filter');

var pathToBeeper = path.join(__dirname, 'fixtures', 'beeper.js');

describe('Penelope', function() {
  describe('createEventStream', function() {
    it('should return an event stream that decorates events', function() {
      var runner = new Penelope();
      var stream1 = runner.createEventStream('one', 'foo', 'stdout');
      var stream2 = runner.createEventStream('two', 'bar', 'stderr');
      var events = [];
      var eventHandler = function(data) {
        events.push(data);
      };
      stream1.on('data', eventHandler);
      stream2.on('data', eventHandler);
      stream1.write('here is some stuff');
      stream2.write('writing to stream 2');
      stream1.write('here is more stuff');
      events.length.should.equal(3);
      events[0].message.should.equal('here is some stuff');
      events[0].command.should.equal('foo');
      events[0].stream.should.equal('stdout');
      events[1].command.should.equal('bar');
      events[1].stream.should.equal('stderr');
      events[2].message.should.equal('here is more stuff');
    });
  });
  describe('runCommand', function() {
    it('should start a subcommand.', function(done) {
      return done();
      var runner = new Penelope();
      runner.eventStream
        .pipe(filter({stream: 'stdout'}))
        .pipe(es.writeArray(function(error, array) {
          array[0].message.should.equal('beep');
          array.length.should.equal(4);
          done(error);
        }));
      var args = [
        '--stdout-messages', 5,
        '--stderr-messages', 5
      ];
      runner.runCommand('one', pathToBeeper, args);
    });
    it('should call a provided callback when a subcommand completes.', function(done) {
      var runner = new Penelope();
      runner.runCommand('foo', pathToBeeper, ['--stdout-message', 'foo'], function(error) {
        should.not.exist(error);
        done();
      });
    });
    it('should call a provided callback with an error if the subcommand exits non-zero.', function(done) {
      var runner = new Penelope();
      var args = [
        '--exit', 2
      ];
      runner.runCommand('one', pathToBeeper, args, function(error) {
        should.exist(error);
        error.message.should.match(/exited with code 2/);
        done();
      });
    });
    it('should start multiple subcommands.', function(done) {
      var runner = new Penelope();
      
      async.parallel([
        function(cb) {
          var hasRun = false;
          runner.eventStream
            .on('data', function() {
              if (!hasRun) {
                hasRun = true;
                var children = runner.getChildren();
                Object.keys(children).length.should.equal(2);
                cb();
              }
            });
        },
        function(cb) {
          runner.eventStream
            .pipe(filter({
              stream: 'stderr',
              name: 'one'
            }))
            .pipe(es.writeArray(function(error, array) {
              array[0].message.should.equal('pong');
              array.length.should.equal(1);
              cb(error);
            }));
        },
        function(cb) {
          runner.eventStream
            .pipe(filter({
              stream: 'stdout',
              name: 'two',
            }))
            .pipe(es.writeArray(function(error, array) {
              array.length.should.equal(1);
              array[0].message.should.equal('beemp');
              cb(error);
            }));
        },
        function(cb) {
          runner.eventStream
            .pipe(filter({
              stream: 'stdout',
            }))
            .pipe(es.writeArray(function(error, array) {
              array.length.should.equal(2);
              cb(error);
            }));
        },
      ], done);
      // Our process might be called node or nodejs depending on distro.
      runner.runCommand('one', pathToBeeper, ['--stdout-message', 'ping', '--stderr-message', 'pong']);
      runner.runCommand('two', pathToBeeper, ['--stdout-message', 'beemp', '--stderr-message', 'bomp']);
    });
  });
});
