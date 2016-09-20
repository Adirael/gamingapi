var express     = require('express');
var app         = express();
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var mongoose    = require('mongoose');
var passport  = require('passport');
var config      = require('./config/database'); // get db config file
var User        = require('./app/models/users'); // get the mongoose model
var Game        = require('./app/models/games');
var port        = process.env.PORT || 8080;
var jwt         = require('jwt-simple');
 
// get our request parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
 
// log to console
app.use(morgan('dev'));
 
// Use the passport package in our application
app.use(passport.initialize());
 
// demo Route (GET http://localhost:8080)
app.get('/', function(req, res) {
  res.send('Hello! The API is at http://localhost:' + port + '/api');
});
 
// Start the server
app.listen(port);
console.log('There will be dragons: http://localhost:' + port);

// connect to database
mongoose.connect(config.database);
 
// pass passport for configuration
require('./config/passport')(passport);
 
// bundle our routes
var apiRoutes = express.Router();
 
// create a new user account (POST http://localhost:8080/api/signup)
apiRoutes.post('/signup', function(req, res) {
  if (!req.body.name || !req.body.password) {
    res.json({success: false, msg: 'Please pass name and password.'});
  } else {
    var newUser = new User({
      name: req.body.name,
      password: req.body.password,
      gamesPending: {},
      gamesBorrowed: {},
      gamesDone: {},
      gamesPlaying: {}
    });
    // save the user
    newUser.save(function(err) {
      if (err) {
        return res.json({success: false, msg: 'Username already exists.'});
      }
      res.json({success: true, msg: 'Successful created new user.'});
    });
  }
});

apiRoutes.post('/authenticate', function(req, res) {
  User.findOne({
    name: req.body.name
  }, function(err, user){
    if (err) throw err;
    if (!user) {
      res.send({success: false, msg: 'Authentication failed. User not found'});
    } else {
      // Check if Password Matches
      user.comparePassword(req.body.password, function(err, isMatch){
        if (isMatch && !err) {
          //user found and pass ok
          var token = jwt.encode(user, config.secret);
          res.json({success: true, token: 'JWT '+token});
        } else {
          res.send({success: false, msg: 'Authentication Failed, Wrong Password'})
        }
      });
    }
  });
});

apiRoutes.post('/gameadd', function(req, res) {
  if (!req.body.name || !req.body.platform || !req.body.cover) {
    res.json({success: false, msg:'Please add some fields required.'});
  } else {
    var newGame = new Game({
      name: req.body.name,
      platform: req.body.platform,
      cover: req.body.cover
    });
    newGame.save(function(err){
      if (err) {
        return res.json({success:false, msg: 'Game already added'});
      }
      res.json({success:true, msg: 'Game added to list'});
    });
  }
});
/* Not necessary?
apiRoutes.post('/addpendinggame', function(req, res){
  if(!req.body.name || !req.body.username) {
    res.json({success:false, msg:'Some fields required'});
  } else {
    User.findOneAndUpdate({'name':req.body.username},  {$push:{gamesPending:{name: req.body.name}}}, {upsert:true}, function(err, user){
      if (err) {
        return res.json({success: false, msg: 'Error ocurred'});
      }
      res.json({success:true, msg: 'Game added to pending list'});
    });
  }
});
*/

apiRoutes.post('/checkpendinggame', function(req, res){
  if(!req.body.name || !req.body.username || !req.body.gameType) {
    res.json({success:false, msg:'Some fields required'});
  } else {
    if (req.body.gameType == 'pending') {
      User.findOne({'name':req.body.username, 'gamesPending.name': req.body.name}, function(err, result){
        if (err) {
          return res.json({success: false, msg: 'Error ocurred'});
        }
        if (!result) {
          User.findOneAndUpdate({'name':req.body.username}, {$push:{gamesPending:{name: req.body.name}}}, {upsert:true}, function (err, result){
            if(err) {
              return res.json({success: false, msg: 'Error ocurred'});
            }
            return res.json({gameinlist: false, msg: 'Game Added to Pending List'});
          });
        } else {
          return res.json({gameinlist: true, msg: 'The game is in list'});
        }
      });
    } else if (req.body.gameType == 'borrowed') {
      User.findOne({'name':req.body.username, 'gamesBorrowed.name': req.body.name}, function(err, result){
        if (err) {
          return res.json({success: false, msg: 'Error ocurred'});
        }
        if (!result) {
          User.findOneAndUpdate({'name':req.body.username}, {$push:{gamesBorrowed:{name: req.body.name}}}, {upsert:true}, function (err, result){
            if(err) {
              return res.json({success: false, msg: 'Error ocurred'});
            }
            return res.json({gameinlist: false, msg: 'Game Added to Borrowed List'});
          });
        } else {
          return res.json({gameinlist: true, msg: 'The game is in list'});
        }
      });
    } else if (req.body.gameType == 'done') {
      User.findOne({'name':req.body.username, 'gamesDone.name': req.body.name}, function(err, result){
        if (err) {
          return res.json({success: false, msg: 'Error ocurred'});
        }
        if (!result) {
          User.findOneAndUpdate({'name':req.body.username}, {$push:{gamesDone:{name: req.body.name}}}, {upsert:true}, function (err, result){
            if(err) {
              return res.json({success: false, msg: 'Error ocurred'});
            }
            return res.json({gameinlist: false, msg: 'Game Added to Done List'});
          });
        } else {
          return res.json({gameinlist: true, msg: 'The game is in list'});
        }
      });
    } else if (req.body.gameType == 'playing') {
      User.findOne({'name':req.body.username, 'gamesPlaying.name': req.body.name}, function(err, result){
        if (err) {
          return res.json({success: false, msg: 'Error ocurred'});
        }
        if (!result) {
          User.findOneAndUpdate({'name':req.body.username}, {$push:{gamesPlaying:{name: req.body.name}}}, {upsert:true}, function (err, result){
            if(err) {
              return res.json({success: false, msg: 'Error ocurred'});
            }
            return res.json({gameinlist: false, msg: 'Game Added to Playing List'});
          });
        } else {
          return res.json({gameinlist: true, msg: 'The game is in list'});
        }
      });
    } else {
      User.findOne({'name':req.body.username, 'gamesWishlist.name': req.body.name}, function(err, result){
        if (err) {
          return res.json({success: false, msg: 'Error ocurred'});
        }
        if (!result) {
          User.findOneAndUpdate({'name':req.body.username}, {$push:{gamesWishlist:{name: req.body.name}}}, {upsert:true}, function (err, result){
            if(err) {
              return res.json({success: false, msg: 'Error ocurred'});
            }
            return res.json({gameinlist: false, msg: 'Game Added to Playing List'});
          });
        } else {
          return res.json({gameinlist: true, msg: 'The game is in list'});
        }
      });
    }

  }
});


apiRoutes.get('/memberinfo', passport.authenticate('jwt', {session: false}), function(req,res){
  var token = getToken(req.headers);
  if (token) {
    var decoded = jwt.decode(token, config.secret);
    User.findOne({
      name: decoded.name
    }, function(err, user){
      if (err) throw err;
      if(!user) {
        return res.status(403).send({success: false, msg: 'Authentication failed. User not found'});
      } else {
        res.json({success: true, msg: 'Welcome to the member area '+user.name});
      }
    });
  } else {
    return res.status(403).send({success: false, msg: 'No token provided'});
  }
});

getToken = function(headers) {
  if (headers && headers.authorization) {
    var parted = headers.authorization.split(' ');
    if (parted.length === 2) {
      return parted[1];
    } else {
      return null;
    }
  } else {
    return null;
  }
};

apiRoutes.get('/gameslist', function(req,res){
  var gamesJson = [];
  Game.find({},function(err, games){
    if (err) {
      return res.json({sucess: false, msg: 'An error ocurred'})
    }
    if (!games) {
      return res.status(403).send({success: false, msg: 'There are no games'})
    } else {
      for(i=0;i<games.length;i++) {
        gamesJson.push({
          name: games[i].name,
          platform: games[i].platform,
          cover: games[i].cover
        });
      }
      return res.status(403).send({gamesList: gamesJson});
    }
  });
});
 
// connect the api routes under /api/*
app.use('/api', apiRoutes);