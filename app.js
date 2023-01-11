const logger = require('./utils/logger')
const express = require('express')
require('express-async-errors')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const { MONGODB_URI } = require('./utils/config')
const blogsRouter = require('./controllers/blogs')


logger.info('Connecting to database')

mongoose.connect(MONGODB_URI)
  .then(() => {
    logger.info('Connected to the database')
  })
  .catch(error => {
    logger.error('Error connecting to the database', error.message)
  })

app.use(cors())
app.use(express.json())

app.use('/api/blogs', blogsRouter)

module.exports = app