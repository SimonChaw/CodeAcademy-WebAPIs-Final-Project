const bodyParser = require('body-parser');
const cors = require('cors');
const errorhandler = require('errorhandler');
const express = require('express');


const app = express();
//Set PORT
const PORT = process.env.PORT || 4000;

//Set up dependencies
app.use(bodyParser.json());
app.use(cors());
app.use(errorhandler());

//Start server
app.listen(PORT, () => {
  console.log('Listening on port: ' + PORT);
});

module.exports = app;
