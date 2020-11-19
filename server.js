const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const { Schema } = mongoose;
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost/exercise-track', { useNewUrlParser: true, useUnifiedTopology: true } );

app.use(cors());

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
const urlencodedParser = bodyParser.urlencoded({extended: false});
// console.log(urlencodedParser);


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// My Code //////////

console.log("Hello World!");

// Mongoose
const usernameSchema = new Schema({
  username: { type: String, required: true }
});
const User = mongoose.model("Profiles", usernameSchema)


// POST new username and save it to the db. 
app.post('/api/exercise/new-user', urlencodedParser, async (req, res) => {
  console.log(req.body);
  const username = new User({
    username: req.body.username
  });
  username.save((err, res) => {
    if (err) console.log(err)
  })
});



// POST exercises
app.post('/api/exercise/add', urlencodedParser, async (req, res) => {
  console.log("TODO new exercise");
  console.log(req.body);
});

// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'});
});

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage;

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  };
  res.status(errCode).type('txt')
    .send(errMessage)
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
