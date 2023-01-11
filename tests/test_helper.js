const Blog = require('../models/blog')

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
  const blog = new Blog({ content: 'willremovethissoon', date: new Date() })
  await blog.save()
  await blog.remove()
  return blog._id.toString()
}

const blogsInDb = async () => {
  const blogs = await Blog.find({})
  return blogs.map(blog => blog.toJSON())
}

module.exports = {
  initialBlogs, nonExistingId, blogsInDb
}