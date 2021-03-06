// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';
const common = require('../common');
const http = require('http');
const fs = require('fs');
const path = require('path');

common.refreshTmpDir();

const file = path.join(common.tmpDir, 'http-pipe-fs-test.txt');

const server = http.createServer(common.mustCall(function(req, res) {
  const stream = fs.createWriteStream(file);
  req.pipe(stream);
  stream.on('close', function() {
    res.writeHead(200);
    res.end();
  });
}, 2)).listen(0, function() {
  http.globalAgent.maxSockets = 1;

  for (let i = 0; i < 2; ++i) {
    (function(i) {
      const req = http.request({
        port: server.address().port,
        method: 'POST',
        headers: {
          'Content-Length': 5
        }
      }, function(res) {
        res.on('end', function() {
          console.error('res' + i + ' end');
          if (i === 2) {
            server.close();
          }
        });
        res.resume();
      });
      req.on('socket', function(s) {
        console.error('req' + i + ' start');
      });
      req.end('12345');
    }(i + 1));
  }
});
