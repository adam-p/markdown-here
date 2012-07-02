var path = require('path');
var tako = require('tako');

var app = tako();

app.route('/').file(path.join(__dirname, 'index.html'));

app.httpServer.listen(3000);
