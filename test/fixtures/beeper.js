#! /usr/bin/env node
// A simple test script used to verify that we're getting the
// right output from our process wrapper.

var yargs = require('yargs');

var argv = yargs
  .usage('Perform test operations.')
  .example('./beeper.js --stdout-messages 5 --stderr-messages 5 --exit 0', 'print 5 messages to stdout and 5 to stderr then exit 0')
  .default('h', false)
  .alias('h', 'help')
  .describe('h', 'Print this help message')
  .default('s', 1)
  .alias('s', 'stdout-messages')
  .describe('s', 'The number of messages to print to stdout.')
  .default('e', 1)
  .alias('e', 'stderr-messages')
  .describe('e', 'The number of messages to print to stderr.')
  .describe('S', 'The message to print on stdout')
  .default('S', 'beep')
  .alias('S', 'stdout-message')
  .describe('E', 'The message to print on stderr')
  .default('E', 'boop')
  .alias('E', 'stderr-message')
  .alias('E', 'exit', 'Exit code')
  .default('i', 2)
  .alias('i', 'interval')
  .describe('i', 'Interval (in miliseconds) between messages')
  .argv;

if (argv.help) {
  yargs.showHelp();
  process.exit(0);
}


// State to watch for the right time to exit.
var messagesSent = {
  stdout: 0,
  stderr: 0,
};

setInterval(function() {
  var outMet = messagesSent.stdout >= argv['stdout-messages'];
  var errMet = messagesSent.stderr >= argv['stderr-messages'];
  if (outMet && errMet) {
    process.exit(argv.exit);
  }
  if (!outMet) {
    console.log(argv['stdout-message']);
    messagesSent.stdout++;
  }
  if (!errMet) {
    console.error(argv['stderr-message']);
    messagesSent.stderr++;
  }
}, argv.interval);


