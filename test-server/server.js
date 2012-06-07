var express = require('express');
var app = express.createServer();

app.listen(3000);

app.get('/', function(req, res) {
  res.sendfile(__dirname + '/index.html'); });

app.use('/', express.static(__dirname + '/'));

