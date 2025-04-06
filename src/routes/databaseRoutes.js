const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Simulated database
const db = {
  users: [],
  posts: [],
  comments: []
};

// Generate some initial data
for (let i = 1; i <= 10; i++) {
  db.users.push({
    id: i,
    name: `User ${i}`,
    email: `user${i}@example.com`,
    createdAt: new Date().toISOString()
  });
  
  for (let j = 1; j <= 5; j++) {
    const postId = (i - 1) * 5 + j;
    db.posts.push({
      id: postId,
      userId: i,
      title: `Post ${postId} by User ${i}`,
      content: `This is the content of post ${postId}`,
      createdAt: new Date().toISOString()
    });
    
    for (let k = 1; k <= 3; k++) {
      const commentId = (postId - 1) * 3 + k;
      db.comments.push({
        id: commentId,
        postId: postId,
        userId: Math.floor(Math.random() * 10) + 1,
        content: `Comment ${commentId} on post ${postId}`,
        createdAt: new Date().toISOString()
      });
    }
  }
}

// Get all users
router.get('/users', (req, res) => {
  logger.info('Database users request', { count: db.users.length });
  
  // Simulate database query delay
  setTimeout(() => {
    res.json({
      users: db.users,
      count: db.users.length,
      timestamp: new Date().toISOString()
    });
  }, 100);
});

// Get user by ID
router.get('/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  logger.info('Database user request', { userId });
  
  // Simulate database query delay
  setTimeout(() => {
    const user = db.users.find(u => u.id === userId);
    
    if (!user) {
      logger.warn('User not found', { userId });
      return res.status(404).json({
        error: 'User not found',
        timestamp: new Date().toISOString()
      });
    }
    
    // Get user's posts
    const posts = db.posts.filter(p => p.userId === userId);
    
    res.json({
      user,
      posts,
      timestamp: new Date().toISOString()
    });
  }, 150);
});

// Get all posts
router.get('/posts', (req, res) => {
  logger.info('Database posts request', { count: db.posts.length });
  
  // Simulate database query delay
  setTimeout(() => {
    res.json({
      posts: db.posts,
      count: db.posts.length,
      timestamp: new Date().toISOString()
    });
  }, 200);
});

// Get post with comments
router.get('/posts/:id', (req, res) => {
  const postId = parseInt(req.params.id);
  logger.info('Database post request', { postId });
  
  // Simulate database query delay
  setTimeout(() => {
    const post = db.posts.find(p => p.id === postId);
    
    if (!post) {
      logger.warn('Post not found', { postId });
      return res.status(404).json({
        error: 'Post not found',
        timestamp: new Date().toISOString()
      });
    }
    
    // Get post author
    const author = db.users.find(u => u.id === post.userId);
    
    // Get post comments with authors
    const comments = db.comments
      .filter(c => c.postId === postId)
      .map(comment => {
        const commentAuthor = db.users.find(u => u.id === comment.userId);
        return {
          ...comment,
          author: commentAuthor ? { id: commentAuthor.id, name: commentAuthor.name } : null
        };
      });
    
    res.json({
      post,
      author,
      comments,
      timestamp: new Date().toISOString()
    });
  }, 250);
});

// Simulated database error
router.get('/db-error', (req, res) => {
  const dbError = new Error('Database connection error');
  dbError.code = 'DB_CONN_ERROR';
  dbError.details = 'Simulated database connection timeout after 5000ms';
  dbError.query = 'SELECT * FROM users WHERE id = ?';
  dbError.params = ['user_123'];
  
  logger.error('Simulated database error', {
    error: dbError.message,
    code: dbError.code, 
    details: dbError.details,
    query: dbError.query,
    params: dbError.params,
    stack: dbError.stack
  });
  
  setTimeout(() => {
    res.status(500).json({
      error: dbError.message,
      code: dbError.code,
      details: dbError.details,
      query: dbError.query,
      params: dbError.params,
      timestamp: new Date().toISOString()
    });
  }, 1000);
});

// Slow database query
router.get('/slow-query', (req, res) => {
  logger.warn('Slow database query initiated');
  
  // Simulate a very slow database query
  setTimeout(() => {
    logger.info('Slow database query completed');
    
    // Complex data aggregation that would be slow in a real DB
    const userStats = db.users.map(user => {
      const userPosts = db.posts.filter(p => p.userId === user.id);
      const userCommentCount = db.comments.filter(c => c.userId === user.id).length;
      
      const postStats = userPosts.map(post => {
        const postComments = db.comments.filter(c => c.postId === post.id);
        return {
          postId: post.id,
          title: post.title,
          commentCount: postComments.length,
          commenters: [...new Set(postComments.map(c => c.userId))]
        };
      });
      
      return {
        userId: user.id,
        name: user.name,
        postCount: userPosts.length,
        commentCount: userCommentCount,
        posts: postStats
      };
    });
    
    res.json({
      userStats,
      executionTime: '3 seconds',
      timestamp: new Date().toISOString()
    });
  }, 3000);
});

module.exports = router; 