var run = require('comandante');
var es = require('event-stream');

// Constructor function.
var Penelope = function() {
  this.runCommand = this.runCommand.bind(this);
  this.createEventStream = this.createEventStream.bind(this);
  this.rawStream = es.through();
  this.eventStream = es.through();
};

// The array of running streams (wrapped by commandante.
Penelope.prototype.processStreams = [];

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
  var stream = run.apply(null, args);
  stream.pipe(this.rawStream);
  var self = this;
  // The most recent error, determines whether an error has occurred for the
  // "done" event call.
  var mostRecentError = null;
  stream.on('error', function(error) {
    mostRecentError = error;
  });
  if (done) {
    stream.on('end', function(error) {
      // It takes a two rounds of the event loop from the time the stream
      // terminates for the error event to be thrown.
      setImmediate(function() {
        setImmediate(function() {
          done(mostRecentError);
        });
      });
    });
  }
  stream
    .pipe(es.split())
    .pipe(this.createEventStream(name, command, 'stdout'))
    .pipe(this.eventStream);
  stream.stderr
    .pipe(es.split())
    .pipe(this.createEventStream(arguments[0], 'stderr'))
    .pipe(this.eventStream);
  this.processStreams.push(stream);
};

// Get a throughstream.
Penelope.prototype.createEventStream = function(name, command, streamName) {
  return es.through(function(data) {
    data = {
      name: name,
      command: command,
      message: data,
      stream: streamName,
    };
    this.emit('data', data);
  });
};

module.exports = Penelope;
