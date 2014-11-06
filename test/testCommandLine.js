var path = require('path'),
  should = require('should'),
  http = require('http'),
  run = require('comandante'),
  es = require('event-stream'),
  async = require('async');

var filter = require('./helpers/filter');

var beeperPath = path.join(__dirname, 'fixtures', 'beeper.js');
var penelopeBinPath = path.join(__dirname, '..', 'bin', 'penelope');

describe('penelope executable', function() {
  it('should display helptext', function(done) {
    var stream = run(penelopeBinPath, ['-h']);
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
  it ('should print its own version number', function(done) {
    var stream = run(penelopeBinPath, ['-v']);
    stream
      .pipe(es.split())
      .pipe(es.writeArray(function(error, array) {
        should.exist(array[0]);
        array[0].should.equal(require('../package').version);
        done(error);
      }));
  });
  it('should run a single command', function(done) {
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
});
