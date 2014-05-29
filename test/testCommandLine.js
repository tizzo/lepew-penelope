var path = require('path');
var should = require('should');
var run = require('comandante');
var es = require('event-stream');
var async = require('async');

var filter = require('./helpers/filter');

var beeperPath = path.join(__dirname, 'fixtures', 'beeper.js');
var penelopeBinPath = path.join(__dirname, '..', 'bin', 'penelope');

describe('penelope executable', function() {
  it('should display helptext', function(done) {
    var stream = run(path.join(__dirname, '..', 'bin', 'penelope'), ['-h']);
    var output = '';
    stream.stderr.pipe(es.through(
      function(data) {
        output += data;
      },
      function() {
        output.should.containEql('Display this help text');
        done();
      }
    ))
    .pipe(process.stdout);
  });
  it('should run a signle command', function(done) {
    var args = [
      '-c', beeperPath
    ];
    var stream = run(penelopeBinPath, args);
    stream
      .pipe(es.split())
      .pipe(es.parse())
      .pipe(es.writeArray(function(error, array) {
        array.length.should.equal(2);
        array[0].stream.should.equal('stdout');
        array[0].message.should.equal('beep');
        array[1].stream.should.equal('stderr');
        array[1].message.should.equal('boop');
        done(error);
      }));
  });
  it('should run a multiple commands', function(done) {
    var args = [
      '-c', 'echo foo',
      '-c', beeperPath + ' -S jimmy -E hendrix'
    ];
    var stream = run(penelopeBinPath, args);
    
    var eventStream = es.through();

    stream
      .pipe(es.split())
      .pipe(es.parse())
      .pipe(eventStream);
    async.parallel(
      [
        function(cb) {
          eventStream
            .pipe(filter({name: 'echo'}))
            .pipe(es.writeArray(function(error, array) {
              array.length.should.equal(1);
              array[0].message.should.equal('foo');
              cb(error);
            }));
        },
        function(cb) {
          eventStream
            .pipe(filter({name: beeperPath, stream: 'stdout'}))
            .pipe(es.writeArray(function(error, array) {
              array.length.should.equal(1);
              array[0].message.should.equal('jimmy');
              cb(error);
            }));
        },
        function(cb) {
          eventStream
            .pipe(filter({name: beeperPath, stream: 'stderr'}))
            .pipe(es.writeArray(function(error, array) {
              array.length.should.equal(1);
              array[0].message.should.equal('hendrix');
              cb(error);
            }));
        }
      ],
    function(error) {
      done();
    });
  });
  describe('should accept a configuration file as an argument', function() {
    it('should exit non-zero with an error message if the file does not exist.', function(done) {
      var stream = run(path.join(__dirname, '..', 'bin', 'penelope'), ['non-existant file']);
      stream.on('error', function(error) {
        should.exist(error);
        error.message.should.containEql('non-zero exit code 1');
        done();
      });
    });
    it('should exit non-zero with an error message if the file cannot be parsed.', function(done) {
      var configPath = path.join(__dirname, '..', 'test', 'fixtures', 'bad-config.json');
      var stream = run(path.join(__dirname, '..', 'bin', 'penelope'), [configPath]);
      async.series([
        function(cb) {
          stream.on('error', function(error) {
            should.exist(error);
            cb();
          });
        },
        function(cb) {
          cb();
        },
      ], done);
    });
  });
});
