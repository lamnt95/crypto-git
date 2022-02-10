const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const path = require('path');
var cors = require('cors');

app.use(express.static('static'));
app.use(cors());

app.get('/', (req, res) => {
  res.sendFile(path.resolve('pages/index.html'));
});

app.listen(port || 5000, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

app.get('/coin', async (req, res) => {
  res.send('OK');
});
