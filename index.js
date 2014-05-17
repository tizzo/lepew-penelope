var util = require('util');
var spawn = require('child_process').spawn;
var es = require('event-stream');

// Constructor function.
var Penelope = function() {
  this.runCommand = this.runCommand.bind(this);
  this.createEventStream = this.createEventStream.bind(this);
  this.rawStream = es.through();
  this.eventStream = es.through();
};

// The array of running streams (wrapped by commandante.
Penelope.prototype.processStreams = {};

// The unified raw event stream of output (stdout and stderr) from all child
// processes.
Penelope.prototype.rawStream = null;

// The unified event stream of all running subprocesses.
// Each message is a hash with message content, command, and stream.
Penelope.prototype.eventStream = null;

// Run a command as a child process.
// name: A unique name for this command. Useful for differentiating two
//   instances of the same executable.
// command: The command to run as a subprocess.
// args: Optional arguments to be passed to the command.
// options: Optiontal options to be passed through to child_process.
Penelope.prototype.runCommand = function(name, command, args, done) {

  // TODO: Add some arg parsing...
  // Convert args to an array so that it's easier to work with.
  var args = Array.prototype.slice.call(arguments, 0);
  if (typeof(args[args.length - 1]) === 'function') {
    var done = args.pop();
  }
  var name = args.shift();

  // Commandante provides us a full duplex stream.
  var child = spawn.apply(null, args);
  child.stdout.pipe(this.rawStream);
  child.stderr.pipe(this.rawStream);
  var self = this;
  if (done) {
    child.on('error', done);
    child.on('exit', function(code) {
      var error = null;
      if (code !== 0 && code !== false) {
        var string = 'Execution of command %s named %s exited with code %s'
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
  this.processStreams[name] = child;
};

// Get a throughstream.
Penelope.prototype.createEventStream = function(name, command, streamName) {
  var self = this;
  return es.through(function(data) {
    data = {
      name: name,
      command: command,
      message: data,
      stream: streamName,
    };
    this.emit('data', data);
  },
  // Don't end our event stream until all of the child processes have exited.
  function() {
    delete self.processStreams[name];
    if (Object.keys(self.processStreams).length === 0) {
      this.emit('end');
    }
  });
};

module.exports = Penelope;
