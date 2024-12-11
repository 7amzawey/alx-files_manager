const express = require('express');
// eslint-disable-next-line import/no-extraneous-dependencies
const bodyParser = require('body-parser');
const routes = require('./routes/index');

const port = process.env.PORT || 5000;
const app = express();

app.use(bodyParser.json());
app.use('/', routes);

app.listen(port, () => {
  console.log('listening on port 5000');
});
