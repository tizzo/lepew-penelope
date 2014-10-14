var util = require('util');
var spawn = require('child_process').spawn;
var es = require('event-stream');

/**
 * Constructor function.
 */
var Penelope = function() {
  this.runCommand = this.runCommand.bind(this);
  this.createEventStream = this.createEventStream.bind(this);
  this.rawStream = es.through();
  this.eventStream = es.through();
};

// The hash of running child processes.
Penelope.prototype.processes = {};

// The hash of running streams.
Penelope.prototype.processStreams = {};

// The unified raw event stream of output (stdout and stderr) from all child
// processes.
Penelope.prototype.rawStream = null;

// The unified event stream of all running subprocesses.
// Each message is a hash with message content, command, and stream.
Penelope.prototype.eventStream = null;

/**
 * Run a command as a child process.
 *
 * @param {string} name A unique name for this command.
 *     Useful for differentiating two instances of the same executable.
 * @param {string} command The command to run as a subprocess.
 * @param {Array} args Optional arguments to be passed to the command.
 * @param {Object} options Optional hash passed through to child_process.
 * @param {Function} done Optional callback to run when the child process exits.
 */
Penelope.prototype.runCommand = function(name, command, args, done) {

  // Convert args to an array so that it's easier to work with.
  args = Array.prototype.slice.call(arguments, 0);
  if (typeof args[args.length - 1] === 'function') {
    done = args.pop();
  }
  name = args.shift();

  var child = spawn.apply(null, args);

  // Add stdout and stderr to our unified raw stream.
  child.stdout.pipe(this.rawStream);
  child.stderr.pipe(this.rawStream);

  // Bind for event processing for our done callback if we have any.
  if (done) {
    child.on('error', done);
    child.on('exit', function(code) {
      var error = null;
      if (code !== 0 && code !== false) {
        var string = 'Execution of command %s named %s exited with code %s';
        error = new Error(util.format(string, command, name, code));
      }
      done(error);
    });
  }

  child.stdout
    .pipe(es.split())
    .pipe(this.createEventStream(name, command, 'stdout'))
    .pipe(this.eventStream);

  child.stderr
    .pipe(es.split())
    .pipe(this.createEventStream(name, command, 'stderr'))
    .pipe(this.eventStream);
};

/**
 * Get a throughstream that wraps all data passed through.
 *
 * @param {string} name A unique name for this event stream.
 * @param {string} command The name of the command.
 * @param {string} streamName The name of this stream (e.g. stdout or stderr).
 * @return {stream} A throughstream that wraps string input.
 */
Penelope.prototype.createEventStream = function(name, command, streamName) {
  var _this = this;
  this.processStreams[name + ':' + streamName] = es.through(function(data) {
    if (data === '') {
      return;
    }
    data = {
      name: name,
      command: command,
      message: data,
      stream: streamName,
      time: new Date().getTime()
    };
    this.emit('data', data);
  },
  // Don't end our event stream until all of the child processes have exited.
  function() {
    delete _this.processStreams[name + ':' + streamName];
    if (Object.keys(_this.processStreams).length === 0) {
      this.emit('end');
    }
  });
  return this.processStreams[name + ':' + streamName];
};

module.exports = Penelope;
