const express = require('express')
const bodyParser = require('body-parser');
const app = express()
const cors = require('cors')

require('dotenv').config()

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

//console.log(process.env.MONGO_URI)

mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true});

app.use(cors())
app.use(express.static('public'))

app.use(function(req, res, next) {

  console.log(req.method, req.path, "-", req.ip);

  next();
})

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const userSchema = new mongoose.Schema({

  //_id: {type: String},
  username: {type : String, required: true}
})
let User = mongoose.model("User", userSchema)

const exerciseSchema = new mongoose.Schema({

  id: {type: String},
  username: {type : String},
  description : {type : String, required: true},
  duration : {type : Number, required: true},
  date : {type : Date, default: new Date()}
})
let Exercise = mongoose.model("Exercise", exerciseSchema);

var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

app.get("/", function(req, res) {

  //res.send('Hello Express');

  filePath = __dirname + "/views/index.html";

  res.sendFile(filePath);
})

app.post("/api/users", async (req, res) => {

  let username = req.body.username;

  var user = new User({username: username});

  console.log(user._id);

  await user.save((err, data) => {

    if (err) return console.error(err);
  });
  res.json(user);
})

app.get("/api/users", async (req, res) => {

  var userMap = [];
  
  await User.find({}, (err, users) => {

    if (err) return console.error(err);

    users.forEach(user => {
      userMap.push({username : user.username, _id : user._id});
    });
  });
  res.send(userMap);
})

app.post("/api/users/:_id/exercises", async (req, res) => {

  let userId = req.params._id;
  const description = req.body.description;
  const duration = parseInt(req.body.duration);
  const date = req.body.date ? new Date(req.body.date) : new Date();
  console.log(req.body.date);

  const user = await User.findById({_id : userId}).exec();

  var exercise = new Exercise({
    id: user._id, 
    username: user.username,
    description: description,
    duration: duration,
    date: date.toDateString()
  });
  await exercise.save((err, data) =>{

    if (err) return console.error(err);
  });

  const exer = {
    username: user.username,
    description: description,
    duration: duration,
    _id: user._id,
    date: date.toDateString()
  }
  console.log(exer);
  
  res.json(exer);
})

app.get("/api/users/:_id/logs:from?:to?:limit?", async (req, res) => {

  let userId = req.params._id;
  let from = req.query.from;
  let to = req.query.to;
  let limit = req.query.limit;
  //console.log(req.query);

  let logs = {};

  await User.findById({_id : userId}, (err, user) => {

    if (err) return console.error(err);

    logs['username'] = user.username,
    logs['count'] = 0, 
    logs['_id'] = user._id,
    logs['log'] = []
  });

  let query = {id : userId};
  if (from && to) query['date'] = {'$gte': new Date(from), '$lte': new Date(to)};
  if (limit) limit = parseInt(limit);
  //console.log(query);

  const exercises = await Exercise.find(query).limit(limit).exec();

  let counts = 0;
  exercises.forEach(element => {

    let log = {
      description : element.description, 
      duration : element.duration, 
      date: element.date.toDateString()
    }
    logs['log'].push(log);
    counts++;
  });
  logs['count'] = counts;

  //console.log(logs);
  res.send(logs);
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
})
