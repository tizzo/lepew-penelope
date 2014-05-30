var should = require('should');
var validator = require('../lib/validateConfigStructure');

describe('validateConfigStructure', function() {
  it('should that the command is present and is a string', function() {
    validator({'args': []}).should.equal(false);
    validator({'command': []}).should.equal(false);
  });
  it('should not accept an array', function() {
    validator([]).should.equal(false);
  });
  it('should ensure args is an array', function() {
    validator({'command': 'foo', 'args': 'test'}).should.equal(false);
    validator({'command': 'foo', 'args': {'foo': 'bar'}}).should.equal(false);
  });
  it('should ensure options is an object', function() {
    validator({'command': 'foo', 'options': []}).should.equal(false);
    validator({'command': 'foo', 'options': 'test'}).should.equal(false);
    validator({'command': 'foo', 'options': {'foo': 'bar'}}).should.equal(true);
  });
  it('should not accept unrecognized attributes', function() {
    validator({'command': 'foo', 'foo': 'bar'}).should.equal(false);
  });
});
