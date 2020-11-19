const express = require('express');
const moviesRouter = express.Router();
const Models = require('../models.js');

const Movies = Models.Movie;

moviesRouter
.get('/', async (req, res) => {

  let movies = await Movies.find();

  if (movies) {
    res.status(201).json(movies);
  } else {
    res.status(500).send('Error: ' + error);
  }
});

module.exports = moviesRouter