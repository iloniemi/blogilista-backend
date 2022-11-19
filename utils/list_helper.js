const lodash = require('lodash')

const totalLikes = (blogs) => {
  return blogs.length === 0
    ? 0
    : blogs.reduce((sum, blog) => sum + blog.likes, 0)
}

/* Returns the first blog with highest number of likes.
   returns NaN if given an empty list */
const favouriteBlog = (blogs) => {
  if (blogs.length === 0) return NaN

  return blogs.reduce((mostLiked, blog) => (
    blog.likes > mostLiked.likes
      ? blog
      : mostLiked
  ))
}

const mostBlogs = (blogs) => {
  if (blogs.length === 0) return NaN

  const authors = lodash.countBy(blogs, blog => blog.author)
  return lodash.reduce(authors, (mostProlificSoFar, blogs, author) => {
    return mostProlificSoFar.blogs >= blogs
      ? mostProlificSoFar
      : { author, blogs }
  }, {})
}

const mostLikes = (blogs) => {
  if (blogs.length === 0) return NaN

  const groupedBlogs = lodash.groupBy(blogs, blog => blog.author)
  const authorsAndLikes = lodash.map(groupedBlogs, (group, author) => {
    console.log('author', author, 'group', group)
    const likes = group.reduce((sum, blog) => sum + blog.likes, 0)
    return { author, likes }
  })
  return lodash.reduce(authorsAndLikes, (mostLikedAuthor, author) => {
    return mostLikedAuthor.likes >= author.likes
      ? mostLikedAuthor
      : author
  })
}

module.exports = {
  totalLikes,
  favouriteBlog,
  mostBlogs,
  mostLikes
}