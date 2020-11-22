const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const { nanoid } = require('nanoid');
const { Schema } = mongoose;
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost/exercise-track', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const urlencodedParser = bodyParser.urlencoded({ extended: false });
// console.log(urlencodedParser);


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// My Code //////////
console.log("Hello World!");

// Mongoose
const usernameSchema = new Schema({
  _id: { type: String, required: true },
  username: { type: String, required: true },
  // description: { type: String, required: false },
  // duration: { type: Number, required: false },
  // date: { type: String, required: false }
}, { versionKey: false });
const User = mongoose.model("Profiles", usernameSchema);

const exerciseSchema = new Schema({
  userId: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: String, required: true }
}, { versionKey: false });
const Exercise = mongoose.model("Sessions", exerciseSchema);

// 
const makeNewId = async () => {
  let newId = nanoid(10);
  // let newId = "aabbcc" // used to test already existing Id.
  const idExists = await User.findOne({ "_id": newId });
  if (idExists) {
    console.log("ID already exists, generating a new one");
    makeNewId();
  } else {
    return newId;
  };
};

const dateRegEx = /^\d{4}-((0[1-9])|(1[0-2]))-(0[1-9]|([1-2]\d)|(3[0-1]))$/

// POST new username and save it to the db. 
app.post('/api/exercise/new-user', urlencodedParser, async (req, res) => {
  console.log(req.body);
  const usernameExists = await User.findOne({ "username": req.body.username });
  if (req.body.username === "") {
    res.send("Please ender a username")
  } else if (usernameExists) {
    res.send("Username already taken")
  } else {
    const newId = await makeNewId();
    const username = new User({
      _id: newId,
      username: req.body.username
    });
    username.save((err, res) => {
      if (err) console.log(err)
    });
    res.json({
      _id: newId,
      username: req.body.username
    })
  };
});

// GET all users
app.get('/api/exercise/users', (req, res) => {
  console.log("getting the colection")
  // const collection = User.find({});
  User.find({}, (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.json(result);
    };
  });
});

// POST new exercises
app.post('/api/exercise/add', urlencodedParser, async (req, res) => {
  console.log(req.body);
  const id = { "_id": req.body.userId }
  const checkId = await User.findOne(id)
  console.log(checkId)
  let sessionDate;
  if (dateRegEx.test(req.body.date)) {
    sessionDate = new Date(req.body.date);
    // console.log("You entered the date: ", sessionDate.toISOString().split('T')[0])
  } else {
    sessionDate = new Date();
    console.log("today's date is ", sessionDate)
  }
  console.log(sessionDate);
  if (checkId && req.body.description && req.body.duration) {
    const entry = {
      userId: req.body.userId,
      description: req.body.description,
      duration: req.body.duration,
      date: sessionDate
    };
    console.log("entry:", entry)
    const newExercise = new Exercise(entry);
    newExercise.save((err, res) => {
      if (err) console.log(err)
    });
    res.json({
      _id: req.body.userId,
      username: checkId.username,
      date: sessionDate.toDateString(),
      duration: parseInt(req.body.duration),
      description: req.body.description
    })
    console.log("#################")
  } else {
    res.send("Please fill all mandatory fields correctly")
  };
});

// GET all exercises
app.get('/api/exercise/log', async (req, res) => {
  console.log("query userId", req.query.userId)
    const userId = req.query.userId
    const user = await User.findOne({'_id': userId});
  if (user) { //check if user exists
    if (req.query.from || req.query.to) { // check for extra query parameters
      console.log(`from: ${req.query.from} - to: ${req.query.to}`)
      const partialLog = await Exercise.find({'userId': userId}, {'_id': 0, 'userId': 0})
      res.json({'id': user._id, 'username': user.username, 'count': log.length, partialLog})
    } else {
    const log = await Exercise.find({'userId': userId}, {'_id': 0, 'userId': 0})
    res.json({'id': user._id, 'username': user.username, 'count': log.length, log})
    }
  }else{
    res.send("userId does not match")
  }
});

// Not found middleware
app.use((req, res, next) => {
  return next({ status: 404, message: 'not found' });
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
