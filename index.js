const express = require('express'),
  morgan = require('morgan'),
  bodyParser = require('body-parser'),
  mongoose = require('mongoose'),
  cors = require('cors'),
  { check, validationResult } = require('express-validator'),
  moviesRouter = require('./movies/movies-router');

const Models = require('./models.js');

// const Movies = Models.Movie;
const Users = Models.User;

mongoose.connect('mongodb://localhost:27017/myFlixDB', {
 useNewUrlParser: true, useUnifiedTopology: true
});

// mongoose.connect(process.env.CONNECTION_URI, {
//   useNewUrlParser: true, useUnifiedTopology: true
// });

const app = express();

const passport = require('passport');
require('./passport');

//let topMovies = [{title: 'Citizen Kane', year: '1941'}, {title: 'Dude, Where\'s my Car?', year: '2000'}];

app.use(morgan('common'));

app.use(express.static('public'));

app.use(bodyParser.json());

app.use('/movies', moviesRouter)

let allowedOrigins = ['http://localhost:8080', 'http://testsite.com'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      let message = 'The CORS policy for this app doesn\'t allow access from origin ' + origin;
      return callback(new Error(message), false);
    }
  return callback(null, true);
  }
}));

let auth = require('./auth')(app);

//Get all moviespassport.authenticate('jwt', { session: false }), 
// app.get('/movies', async (req, res) => {

//   let movies = await Movies.find();

//   if (movies) {
//     res.status(201).json(movies);
//   } else {
//     res.status(500).send('Error: ' + error);
//   }
// });

//Get one movie by title
// app.get('/movies/:title', passport.authenticate('jwt', { session: false }), (req, res) => {
//   Movies.findOne( { Title: req.params.title })
//   .then((movie) => {
//     res.status(201).json(movie);
//   })
//   .catch((error) => {
//     console.error(error);
//     res.status(500).send('Error: ' + error);
//   });
// });

//Get genre info by genre name
// app.get('/movies/genres/:genre', passport.authenticate('jwt', { session: false }), (req, res) => {
//   Movies.findOne( { 'Genre.Name': req.params.genre })
//   .then((movie) => {
//     res.status(201).send(movie.Genre.Description);
//   })
//   .catch((error) => {
//     console.error(error);
//     res.status(500).send('Error: ' + error);
//   });
// });

//Get director bio, birth, and death from name
// app.get('/movies/directors/:name', passport.authenticate('jwt', { session: false }), (req, res) => {
//   Movies.findOne( { 'Director.Name': req.params.name })
//   .then((movie) => {
//     if (movie.Director.Death) {
//       res.status(201).send(`${movie.Director.Bio}
//         Born: ${movie.Director.Birth}
//         Died: ${movie.Director.Death}`);
//     }
//     else {
//       res.status(201).send(`${movie.Director.Bio}
//         Born: ${movie.Director.Birth}`);
//     }
//   })
//   .catch((error) => {
//     console.error(error);
//     res.status(500).send('Error: ' + error);
//   });
// });

//Add a user
app.post('/users',
[
  check('Username', 'Username of at least 5 characters is required.').isLength({min: 5}),
  check('Username', 'Username must contain alphanumeric characters only.').isAlphanumeric(),
  check('Password', 'Password is required.').not().isEmpty(),
  check('Email', 'Email does not appear to be valid.').isEmail()
], (req, res) => {

  let errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  let hashedPassword = Users.hashPassword(req.body.Password);
  Users.findOne({ Username: req.body.Username })
  .then((user) => {
    if (user) {
      return res.status(400).send(req.body.Username + 'already exists');
    }
    else {
      Users.create({
        Username: req.body.Username,
        Password: hashedPassword,
        Email: req.body.Email,
        Birthday: req.body.Birthday
      })
      .then((user) => { res.status(201).json(user) })
      .catch((error) => {
        console.error(error);
        res.status(500).send('Error: ' + error);
      })
    }
  })
  .catch((error) => {
    console.error(error);
    res.status(500).send('Error: ' + error);
  });
});

//Get all users
app.get('/users', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.find()
  .then((users) => {
    res.status(201).json(users);
  })
  .catch((err) => {
    console.error(error);
    res.status(500).send('Error: ' + error);
  });
});

//Update a user's info, by username
app.put('/users/:username', passport.authenticate('jwt', { session: false }),
[
  check('Username', 'Username of at least 5 characters is required.').isLength({min: 5}),
  check('Username', 'Username must contain alphanumeric characters only.').isAlphanumeric(),
  check('Password', 'Password is required.').not().isEmpty(),
  check('Email', 'Email does not appear to be valid.').isEmail()
], (req, res) => {

  let errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  let hashedPassword = Users.hashPassword(req.body.Password);

  Users.findOneAndUpdate( { Username: req.params.username }, {
    $set:
    {
      Username: req.body.Username,
      Password: hashedPassword,
      Email: req.body.Email,
      Birthday: req.body.Birthday
    }
  },
  { new: true },
  (err, updatedUser) => {
    if (err)  {
      console.error(error);
      res.status(500).send('Error: ' + error);
    }
    else {
      res.json(updatedUser);
    }
  });
});

//Get a user by username
app.get('/users/:username', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOne({ Username: req.params.username })
  .then((user) => {
    res.json(user);
  })
  .catch((err) => {
    console.error(error);
    res.status(500).send('Error: ' + error);
  });
});

//Add a movie to a user's list of favorites
app.post('/users/:username/add/:MovieId', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOneAndUpdate( { Username: req.params.username }, {
    $push: { Favorites: req.params.MovieId }
  },
  { new: true },
  (err, updatedUser) => {
    if (err) {
      console.error(error);
      res.status(500).send('Error: ' + error);
    }
    else {
      res.json(updatedUser);
    }
  });
});

//Remove Movie from favorites
app.delete('/users/:username/remove/:MovieId', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOneAndUpdate( { Username: req.params.username }, {
    $pull: { Favorites: req.params.MovieId }
  },
  { new: true },
  (err, updatedUser) => {
    if (err) {
      console.error(error);
      res.status(500).send('Error: ' + error);
    }
    else {
      res.json(updatedUser);
    }
  });
});

//Delete User by Username
app.delete('/users/delete/:username', passport.authenticate('jwt', { session: false }), (req, res) => {
  Users.findOneAndRemove({ Username: req.params.username })
    .then((user) => {
      if (!user)  {
        res.status(400).send(req.params.username + ' was not found.');
      }
      else {
        res.status(200).send(req.params.username + ' was deleted.');
      }
    })
    .catch((err) => {
      console.error(error);
      res.status(500).send('Error: ' + error);
    });
});

app.get('/', (req, res) => {
  res.send('Nice to see you! 👋')
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Oh no! That didn\'t work! 🙈')
});

const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log('Your app is listening on Port ' + port);
});
