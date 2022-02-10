const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 5000;
const path = require('path');
var cors = require('cors');
var bodyParser = require('body-parser');

app.use(express.static('static'));
app.use(cors());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());
app.get('/', (req, res) => {
  res.sendFile(path.resolve('pages/index.html'));
});

app.listen(port || 5000, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

app.get('/coin', async (req, res) => {
  const a = await axios.get('https://java-crypto.herokuapp.com/post/getAll');
  console.log('a success');
  res.send(a);
});
