// A simple test script used to verify that we're getting the right output
// from our process wrapper.

var beep = setInterval(function() {
  console.log(process.argv[4] || 'beep');
}, process.argv[2]);

var boop = setInterval(function() {
  console.error(process.argv[5] || 'boop');
}, process.argv[2]);

setTimeout(function() {
  clearInterval(beep);
  clearInterval(boop);
  console.log('here');
  process.exit(1);
}, process.argv[3]);
