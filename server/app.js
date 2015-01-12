var app = require('http').createServer(handler).listen(7777);
var io = require('socket.io')(app);
var fs = require('fs');

function handler (req, res) {
  fs.readFile(__dirname + '/template.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }
    res.writeHead(200);
    res.end(data);
  });
}

// comments.jsonのファイル変更を監視してemitする
var target = process.argv[2];
if (! target) {
  console.error('usage: ' + process.argv.join(' ') + ' <filename>');
  process.exit(1);
}
fs.stat(target, function (err, stat) {
  if (err) { throw err; }
  if(! stat.isFile()) {
    console.error(target + ' is not file');
    process.exit(1);
  }

  fs.watchFile(target, { interval: 500 }, function (curr, prev) {
    fs.readFile(target, 'utf8', function (err, text) {
      if (err) { throw err; }
      console.log(target + ' is changed to', text);
      io.sockets.emit('reset', text);
    });
  });
});

io.on('connection', function (socket) {
  console.log('socket connected', socket.id);

  // 接続時に初回データを送信する
  fs.readFile(target, 'utf8', function (err, text) {
    if (err) { throw err; }
    console.log(target + ' is ', text);
    socket.emit('reset', text);
  });

  // TODO save data appropriately
  socket.on('post', function(data) {
    console.log('data posted: ', data);
    socket.broadcast.emit('add', data);
  });
});
