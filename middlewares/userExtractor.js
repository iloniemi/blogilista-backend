const jwt = require('jsonwebtoken')
const User = require('../models/user')

/* Uses request.token to set corresponding request.user */
const userExtractor = async (request, response, next) => {
  const token = request.token

  const decodedtoken = jwt.verify(token, process.env.SECRET)

  request.user = await User.findById(decodedtoken.id)

  next()
}

module.exports = userExtractor