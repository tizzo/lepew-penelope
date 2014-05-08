var should = require('should');
var Penelope = require('../index');

describe('Penelope', function() {
  describe('createEventStream', function() {
    it('should return an event stream that decorates events', function() {
      var runner = new Penelope();
      var stream1 = runner.createEventStream('foo', 'stdout');
      var stream2 = runner.createEventStream('bar', 'stderr');
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
  it('should start a subcommand.', function(done) {
    var runner = new Penelope();
    done();
  });
});
