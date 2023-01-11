const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const Blog = require('../models/blog')
const helper = require('./test_helper')

describe('With some initial blogs', () => {
  beforeEach(async () => {
    await Blog.deleteMany({})
    // beforeEach ei jaisi odottamaan .forEachilla tehtyjen promissien valmistumista
    for (let blog of helper.initialBlogs) {
      let blogObject = new Blog(blog)
      await blogObject.save()
    }
  })

  describe('GET all', () => {
    test('blogs returned in json format', async () => {
      await api
        .get('/api/blogs')
        .expect(200)
        .expect('Content-Type', /application\/json/)
    })

    test('all the blogs are returned', async () => {
      const response = await api.get('/api/blogs')
      expect(response.body).toHaveLength(helper.initialBlogs.length)
    })

    test('specific blog is returned among the blogs', async () => {
      const response = await api.get('/api/blogs')
      const titles = response.body.map(r => r.title)
      expect(titles).toContain(helper.initialBlogs[1].title)
    })

    test('field id is defined for blogs', async () => {
      const blogs = await helper.blogsInDb()
      blogs.forEach(blog => expect(blog.id).toBeDefined())
    })
  })

  describe('POST', () => {
    test('a valid blog can be added', async () => {
      const newBlog = {
        title: 'CoolTitle',
        author: 'Cool Test Author',
        url: 'coolexample.com',
        likes: 123
      }

      await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      const blogsAfter = await helper.blogsInDb()
      expect(blogsAfter).toHaveLength(helper.initialBlogs.length + 1)

      const titles = blogsAfter.map(blog => blog.title)
      expect(titles).toContain(newBlog.title)
    })

    test('blog without likes field is added with 0 likes', async () => {
      const newBlog = {
        title: 'CoolTitle',
        author: 'Cool Test Author',
        url: 'coolexample.com',
      }

      const response = await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(201)
        .expect('Content-Type', /application\/json/)

      expect(response.body.likes).toBe(0)

      const blogs = await helper.blogsInDb()
      expect(blogs).toHaveLength(helper.initialBlogs.length + 1)

      const titles = blogs.map(blog => blog.title)
      expect(titles).toContain(newBlog.title)
    })

    test('an invalid blog is not added', async () => {
      const newBlog = {
        author: 'Cool Test Author',
        likes: 12
      }
      await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(400)

      const blogsAfter = await helper.blogsInDb()
      expect(blogsAfter).toHaveLength(helper.initialBlogs.length)
    })
  })

  describe('DELETE', () => {
    test('succeeds with status code 204 for a valid id', async () => {
      const blogsAtStart = await helper.blogsInDb()
      const blogToDelete = blogsAtStart[0]

      await api
        .delete(`/api/blogs/${blogToDelete.id}`)
        .expect(204)

      const blogsAfter = await helper.blogsInDb()

      expect(blogsAfter).toHaveLength(
        helper.initialBlogs.length - 1
      )

      const titles = blogsAfter.map(r => r.title)

      expect(titles).not.toContain(blogToDelete.title)
    })
  })

  describe('PUT', () => {
    test('likes can be changed', async () => {
      const originalBlogs = await helper.blogsInDb()
      const originalBlog = originalBlogs[0]
      const changedBlog = {
        ...originalBlog,
        likes: originalBlog.likes + 1
      }

      await api
        .put(`/api/blogs/${changedBlog.id}`)
        .send(changedBlog)
        .expect(200)
        .expect('Content-Type', /application\/json/)

      const updatedBlog = await Blog.findById(originalBlog.id)
      expect(updatedBlog.likes).toBe(originalBlog.likes + 1)
    })

    test('error 204 with no changes for using wrong id', async () => {
      const originalBlogs = await helper.blogsInDb()
      const originalBlog = originalBlogs[0]
      const changedBlog = {
        ...originalBlog,
        likes: originalBlog.likes + 1
      }

      const badId = await helper.nonExistingId

      await api
        .put(`/api/blogs/${badId}`)
        .send(changedBlog)
        .expect(400)

      // No changes
      const blogsAfter = await helper.blogsInDb()
      expect(blogsAfter).toHaveLength(helper.initialBlogs.length)

      const blogAfter = blogsAfter.find(blog => blog.id === originalBlog.id)
      expect(blogAfter).toEqual(originalBlog)
    })
  })
})


afterAll(() => {
  mongoose.connection.close()
})