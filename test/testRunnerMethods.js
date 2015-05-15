var should = require('should');
var Penelope = require('..');
var es = require('event-stream');
var path = require('path');
var async = require('async');

var filter = require('./helpers/filter');

var pathToBeeper = path.join(__dirname, 'fixtures', 'beeper.js');

describe('Penelope', function() {
  describe('non-command running methods', function() {
    describe('getConfigs', function() {
      it('should return a signle config by name', function() {
        var runner = new Penelope();
        runner.addProcess('foo', 'echo', ['bar', 'baz']);
        runner.addProcess('bar', 'echo', ['bar', 'baz']);
        var output = runner.getConfig('foo');
        var expected = {
          name: 'foo',
          command: 'echo',
          args: ['bar', 'baz'],
          start: true
        };
        JSON.stringify(output).should.equal(JSON.stringify(expected));
      });
      it('should return null if a bad config is specified', function() {
        var runner = new Penelope();
        runner.addProcess('foo', ['bar', 'baz']);
        runner.addProcess('bar', ['bar', 'baz']);
        should.not.exist(runner.getConfig('zap'));
      });
      it('should return all configs if no name is specified', function() {
        var runner = new Penelope();
        runner.addProcess('foo', 'echo', ['bar', 'baz']);
        runner.addProcess('bar', 'ping', ['bar', 'baz']);
        var output = runner.getConfig();
        Object.keys(output).length.should.equal(2);
        var expected = {
          name: 'foo',
          command: 'echo',
          args: ['bar', 'baz'],
          start: true
        };
        JSON.stringify(output['foo']).should.equal(JSON.stringify(expected));
      });
    });
  });
});
