const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const Blog = require('../models/blog')
const helper = require('./test_helper')
const bcrypt = require('bcrypt')
const User = require('../models/user')

describe('With some initial blogs', () => {
  let token // Token to use for requests

  beforeEach(async () => {
    await Blog.deleteMany({})
    await User.deleteMany({})
    // beforeEach ei jaisi odottamaan .forEachilla tehtyjen promissien valmistumista
    const passwordHash = await bcrypt.hash('salasana123', 10)
    const user = new User({ username: 'hessu', name: 'Hiiri', passwordHash })
    await user.save()
    token = helper.tokenForUser(user)

    for (let blog of helper.initialBlogs) {
      const blogWithUser = { ...blog, user: user._id }
      const blogObject = new Blog(blogWithUser)
      const savedBlog = await blogObject.save()
      user.blogs = user.blogs.concat(savedBlog._id)
    }
    await user.save()
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

  test('POST: a valid blog can be added', async () => {
    const newBlog = {
      title: 'CoolTitle',
      author: 'Cool Test Author',
      url: 'coolexample.com',
      likes: 123
    }

    await api
      .post('/api/blogs')
      .set('Authorization', `bearer ${token}`)
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const blogsAfter = await helper.blogsInDb()
    expect(blogsAfter).toHaveLength(helper.initialBlogs.length + 1)

    const titles = blogsAfter.map(blog => blog.title)
    expect(titles).toContain(newBlog.title)
  })

  test('POST: blog without likes field is added with 0 likes', async () => {
    const newBlog = {
      title: 'CoolTitle',
      author: 'Cool Test Author',
      url: 'coolexample.com',
    }

    const response = await api
      .post('/api/blogs')
      .set('Authorization', `bearer ${token}`)
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    expect(response.body.likes).toBe(0)

    const blogs = await helper.blogsInDb()
    expect(blogs).toHaveLength(helper.initialBlogs.length + 1)

    const titles = blogs.map(blog => blog.title)
    expect(titles).toContain(newBlog.title)
  })

  test('POST: an invalid blog is not added', async () => {
    const newBlog = {
      author: 'Cool Test Author',
      likes: 12
    }
    await api
      .post('/api/blogs')
      .set('Authorization', `bearer ${token}`)
      .send(newBlog)
      .expect(400)

    const blogsAfter = await helper.blogsInDb()
    expect(blogsAfter).toHaveLength(helper.initialBlogs.length)
  })

  test('POST: without token results in 401 error', async () => {
    const newBlog = {
      title: 'MissingTokenTitle',
      author: 'Missing Token Author',
      url: 'missingtokenexample.com',
      likes: 1
    }

    const result = await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(401)

    expect(result.body.error).toBe('token missing or invalid')

    const blogsAfter = await helper.blogsInDb()
    expect(blogsAfter).toHaveLength(helper.initialBlogs.length)
  })

  test('DELETE: succeeds with status code 204 for a valid id', async () => {
    const blogsAtStart = await helper.blogsInDb()
    const blogToDelete = blogsAtStart[0]

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set('Authorization', `bearer ${token}`)
      .expect(204)

    const blogsAfter = await helper.blogsInDb()

    expect(blogsAfter).toHaveLength(
      helper.initialBlogs.length - 1
    )

    const titles = blogsAfter.map(r => r.title)

    expect(titles).not.toContain(blogToDelete.title)
  })


  test('PUT: likes can be changed', async () => {
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

  test('PUT: error 400 with no changes for using non-existent id', async () => {
    const originalBlogs = await helper.blogsInDb()
    const originalBlog = originalBlogs[0]
    const changedBlog = {
      ...originalBlog,
      likes: originalBlog.likes + 1
    }

    const nonExistentId = await helper.nonExistingId

    const result = await api
      .put(`/api/blogs/${nonExistentId}`)
      .send(changedBlog)
      .expect(400)

    expect(result.text).toBe('{"error":"bad id"}')

    // No changes
    const blogsAfter = await helper.blogsInDb()
    expect(blogsAfter).toHaveLength(helper.initialBlogs.length)

    const blogAfter = blogsAfter.find(blog => blog.id === originalBlog.id)
    expect(blogAfter).toEqual(originalBlog)
  })
})


describe('One initial user in the db', () => {
  let token // token to use
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('salasana123', 10)
    const user = new User({ username: 'hessu', name: 'Hiiri', passwordHash })

    await user.save()

    token = helper.tokenForUser(user)
  })

  test('new user can be added', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'taavi',
      name: 'Taavi Tiivi',
      password: 'salasnana'
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

    const usernames = usersAtEnd.map(user => user.username)
    expect(usernames).toContain(newUser.username)
  })

  test('POST: username is already in the db', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'hessu',
      name: 'Username Taken',
      password: 'aaaaaaaaaa',
      blogs: []
    }

    const  result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('username must be unique')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })

  test('POST: too short username error 400 and msg', async () => {
    const usersAtStart = await helper.usersInDb()
    const newUser = {
      username: 'un',
      name: 'Too Short Username',
      password: 'tooshortusername',
      blogs: []
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)

    expect(result.body.error).toBe('User validation failed: username: Username must be at least 3 characters long.')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })

  test('POST: too short password error 400 and msg', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: '2shrtpw',
      name: 'Too Short Password',
      password: 'pw'
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)

    expect(result.body.error).toBe('User validation failed: password: Password must be at least 3 characters long')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })

  test('GET all returns the array containing the one initial user', async () => {
    const result = await api
      .get('/api/users')
      .expect(200)

    const returnedUsers = result.body

    expect(returnedUsers).toHaveLength(1)
    expect(returnedUsers[0].username).toBe('hessu')
  })

  test('POST: blog adds ids referencing each other to the blog and the author', async () => {
    //const user = User.find({})
    const newBlog = {
      title: 'CoolTitle',
      author: 'Cool Test Author',
      url: 'coolexample.com',
      likes: 123
    }

    const result = await api
      .post('/api/blogs')
      .set('Authorization', `bearer ${token}`)
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const createdBlog = result.body
    const userAfter = await User.findById(createdBlog.user) // Change to user._id when possible
    const userBlogsAfter = userAfter.blogs.map(b => b.toString())


    expect(userBlogsAfter).toContain(createdBlog.id)
    expect(createdBlog.user).toBe(userAfter._id.toString())
  })
})


afterAll(() => {
  mongoose.connection.close()
})