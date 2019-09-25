const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const passport = require('passport');
const cors = require('cors')
const config = require('./config/secret');
require('./config/db')
// Use Node's default promise instead of Mongoose's promise library

const app = express();

// Set public folder using built-in express.static middleware
app.use(express.static('public'));
app.use(cors())
// Set body parser middleware
app.use(bodyParser.json());

// Use passport middleware
app.use(passport.initialize());
app.use(passport.session());

require('./config/passport')(passport);

// Initialize routes middleware
app.use('/api/users', require('./routes/users'));

// Use express's default error handling middleware
app.use(function (err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }
  res.status(400).json({ err: err });
});

// Start the server
const port = process.env.PORT || 3000;

app.listen(3000, () => {
  console.log('Listening on port ' + port);
});
