var util = require('util');
var path = require('path');
var async = require('async');
var fs = require('fs');

module.exports = function(files, done) {
  if (files.length > 0) {
    // Map resolve the paths
    files = files.map(function(localPath) {
      return path.resolve(path.join(process.cwd(), localPath));
    });

    var readFile = function(filePath, cb) {
      fs.readFile(filePath, function(error, buffer) {
        if (error) {
          return cb(error);
        }
        try {
          var config = JSON.parse(buffer.toString('utf8'));
          cb(error, {filePath: filePath, config: config});
        }
        catch (e) {
          error = new Error(util.format('Parsing file `%s` failed.', filePath));
          error.code = 'PARSE';
          error.path = filePath;
          cb(error);
        }
      });
    };
    async.map(files, readFile, done);
  }
  else {
    done(null, []);
  }
};
