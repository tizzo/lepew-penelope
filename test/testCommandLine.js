var path = require('path');
var should = require('should');
var run = require('comandante');
var es = require('event-stream');

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
});
