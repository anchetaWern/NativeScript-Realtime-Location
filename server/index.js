const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

require('dotenv').config();
var Pusher = require('pusher');

var pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_APP_KEY,
  secret: process.env.PUSHER_APP_SECRET,
  cluster: process.env.PUSHER_APP_CLUSTER,
});

const app = express();

app.use(cors());

app.use(bodyParser.urlencoded({extended: false}));

app.get('/', (req, res) => {
	res.send('ok');
});

app.post('/pusher/auth', (req, res) => {
  var socketId = req.body.socket_id;
  var channel = req.body.channel_name;
  var auth = pusher.authenticate(socketId, channel);
  res.send(auth);
});

const PORT = 5000;
app.listen(PORT, err => {
  if (err) {
    console.error(err);
  } else {
    console.log(`Running on ports ${PORT}`);
  }
});