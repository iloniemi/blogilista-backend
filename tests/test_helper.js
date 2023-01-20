const Blog = require('../models/blog')
const User = require('../models/user')

const initialBlogs = [
  {
    title: 'TestTitle',
    author: 'Test Author',
    url: 'example.com',
    likes: 15
  },
  {
    title: 'SecondTestTitle',
    author: 'Second Test Author',
    url: 'secondexample.com',
    likes: 22
  }
]

const nonExistingId = async () => {
  const blog = new Blog({
    title: 'This',
    author: 'Will B. Removed',
    url: 'soondexample.com',
    likes: 99
  })
  await blog.save()
  await blog.remove()

  return blog._id.toString()
}

const blogsInDb = async () => {
  const blogs = await Blog.find({})
  return blogs.map(blog => blog.toJSON())
}

const usersInDb = async () => {
  const users = await User.find({})
  return users.map(user => user.toJSON())
}

module.exports = {
  initialBlogs,
  nonExistingId,
  blogsInDb,
  usersInDb
}