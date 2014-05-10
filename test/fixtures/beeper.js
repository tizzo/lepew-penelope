// A simple test script used to verify that we're getting the right output
// from our process wrapper.


var exitCode = process.argv[6] || 0;

var beep = setInterval(function() {
  console.log(process.argv[4] || 'beep');
}, process.argv[2]);

var boop = setInterval(function() {
  console.error(process.argv[5] || 'boop');
}, process.argv[2]);

setTimeout(function() {
  clearInterval(beep);
  clearInterval(boop);
  process.exit(exitCode);
}, process.argv[3]);


