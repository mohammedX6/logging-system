const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const metrics = require('../utils/metrics');

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
  
  // Start tracking database query time
  const startTime = Date.now();
  
  // Simulate database query delay
  setTimeout(() => {
    // Track database query metrics
    const duration = (Date.now() - startTime) / 1000;
    metrics.trackDatabaseQuery('select', 'users', duration);
    
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
  
  // Start tracking database query time
  const startTime = Date.now();
  
  // Simulate database query delay
  setTimeout(() => {
    const user = db.users.find(u => u.id === userId);
    
    // Track database query metrics
    const duration = (Date.now() - startTime) / 1000;
    metrics.trackDatabaseQuery('select', 'users', duration);
    
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
  
  // Start tracking database query time
  const startTime = Date.now();
  
  // Simulate database query delay
  setTimeout(() => {
    // Track database query metrics
    const duration = (Date.now() - startTime) / 1000;
    metrics.trackDatabaseQuery('select', 'posts', duration);
    
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
  
  // Start tracking database query time
  const startTime = Date.now();
  
  // Simulate database query delay
  setTimeout(() => {
    // Track database query metrics
    const duration = (Date.now() - startTime) / 1000;
    metrics.trackDatabaseQuery('select', 'posts', duration);
    
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
  
  // Track database error metrics
  metrics.trackDetailedError('database', 'connection', dbError.code);
  
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

// Oracle ORA-00942: Table or view does not exist
router.get('/ora-00942', (req, res) => {
  const dbError = new Error('ORA-00942: table or view does not exist');
  dbError.code = 'ORA-00942';
  dbError.details = 'The table USERS_PROFILE specified in your query does not exist or is not accessible';
  dbError.query = 'SELECT * FROM USERS_PROFILE WHERE user_id = ?';
  dbError.params = [123];
  dbError.database = 'Oracle';
  
  logger.error('Oracle table not found error', {
    error: dbError.message,
    code: dbError.code,
    details: dbError.details,
    query: dbError.query,
    params: dbError.params,
    database: dbError.database,
    stack: dbError.stack
  });
  
  metrics.trackDetailedError('database', 'oracle', dbError.code);
  
  res.status(500).json({
    error: dbError.message,
    code: dbError.code,
    details: dbError.details,
    query: dbError.query,
    params: dbError.params,
    database: dbError.database,
    timestamp: new Date().toISOString()
  });
});

// Oracle ORA-00001: Unique constraint violated
router.get('/ora-00001', (req, res) => {
  const dbError = new Error('ORA-00001: unique constraint violated');
  dbError.code = 'ORA-00001';
  dbError.details = 'Attempt to insert duplicate value in a column with a unique constraint';
  dbError.query = 'INSERT INTO users (id, email) VALUES (?, ?)';
  dbError.params = [10, 'user1@example.com'];
  dbError.database = 'Oracle';
  
  logger.error('Oracle unique constraint error', {
    error: dbError.message,
    code: dbError.code,
    details: dbError.details,
    query: dbError.query,
    params: dbError.params,
    database: dbError.database,
    stack: dbError.stack
  });
  
  metrics.trackDetailedError('database', 'oracle', dbError.code);
  
  res.status(500).json({
    error: dbError.message,
    code: dbError.code,
    details: dbError.details,
    query: dbError.query,
    params: dbError.params,
    database: dbError.database,
    timestamp: new Date().toISOString()
  });
});

// SQL Syntax Error
router.get('/syntax-error', (req, res) => {
  const dbError = new Error('SQL syntax error');
  dbError.code = 'SYNTAX_ERROR';
  dbError.details = 'Incorrect SQL syntax near "SLECT"';
  dbError.query = 'SLECT * FROM users WHERE id = ?';
  dbError.params = [10];
  dbError.database = 'SQL';
  
  logger.error('SQL syntax error', {
    error: dbError.message,
    code: dbError.code,
    details: dbError.details,
    query: dbError.query,
    params: dbError.params,
    database: dbError.database,
    stack: dbError.stack
  });
  
  metrics.trackDetailedError('database', 'syntax', dbError.code);
  
  res.status(500).json({
    error: dbError.message,
    code: dbError.code,
    details: dbError.details,
    query: dbError.query,
    params: dbError.params,
    database: dbError.database,
    timestamp: new Date().toISOString()
  });
});

// Error in GROUP BY clause
router.get('/group-by', (req, res) => {
  const dbError = new Error('Invalid GROUP BY');
  dbError.code = 'GROUP_BY_ERROR';
  dbError.details = 'Column "email" must appear in the GROUP BY clause or be used in an aggregate function';
  dbError.query = 'SELECT user_id, email, COUNT(*) FROM users GROUP BY user_id';
  dbError.params = [];
  dbError.database = 'SQL';
  
  logger.error('GROUP BY error', {
    error: dbError.message,
    code: dbError.code,
    details: dbError.details,
    query: dbError.query,
    params: dbError.params,
    database: dbError.database,
    stack: dbError.stack
  });
  
  metrics.trackDetailedError('database', 'syntax', dbError.code);
  
  res.status(500).json({
    error: dbError.message,
    code: dbError.code,
    details: dbError.details,
    query: dbError.query,
    params: dbError.params,
    database: dbError.database,
    timestamp: new Date().toISOString()
  });
});

// Error in string conversion
router.get('/string-conversion', (req, res) => {
  const dbError = new Error('String conversion error');
  dbError.code = 'STRING_CONVERSION';
  dbError.details = 'Cannot convert non-string value to string type';
  dbError.query = 'SELECT * FROM users WHERE email = ?';
  dbError.params = [123]; // Should be a string, not a number
  dbError.database = 'SQL';
  
  logger.error('String conversion error', {
    error: dbError.message,
    code: dbError.code,
    details: dbError.details,
    query: dbError.query,
    params: dbError.params,
    database: dbError.database,
    stack: dbError.stack
  });
  
  metrics.trackDetailedError('database', 'conversion', dbError.code);
  
  res.status(500).json({
    error: dbError.message,
    code: dbError.code,
    details: dbError.details,
    query: dbError.query,
    params: dbError.params,
    database: dbError.database,
    timestamp: new Date().toISOString()
  });
});

// Oracle ORA-12154: TNS connection error
router.get('/ora-12154', (req, res) => {
  const dbError = new Error('ORA-12154: TNS:could not resolve the connect identifier specified');
  dbError.code = 'ORA-12154';
  dbError.details = 'Cannot connect to Oracle database - TNS name resolution failure';
  dbError.query = null;
  dbError.params = null;
  dbError.database = 'Oracle';
  
  logger.error('Oracle TNS connection error', {
    error: dbError.message,
    code: dbError.code,
    details: dbError.details,
    database: dbError.database,
    stack: dbError.stack
  });
  
  metrics.trackDetailedError('database', 'connection', dbError.code);
  
  res.status(500).json({
    error: dbError.message,
    code: dbError.code,
    details: dbError.details,
    database: dbError.database,
    timestamp: new Date().toISOString()
  });
});

// Deadlock error
router.get('/deadlock', (req, res) => {
  const dbError = new Error('Deadlock found when trying to get lock');
  dbError.code = 'DEADLOCK';
  dbError.details = 'Transaction deadlock detected, rolled back the transaction';
  dbError.query = 'UPDATE users SET status = ? WHERE id = ?';
  dbError.params = ['active', 10];
  dbError.database = 'SQL';
  
  logger.error('Database deadlock error', {
    error: dbError.message,
    code: dbError.code,
    details: dbError.details,
    query: dbError.query,
    params: dbError.params,
    database: dbError.database,
    stack: dbError.stack
  });
  
  metrics.trackDetailedError('database', 'concurrency', dbError.code);
  
  res.status(500).json({
    error: dbError.message,
    code: dbError.code,
    details: dbError.details,
    query: dbError.query,
    params: dbError.params,
    database: dbError.database,
    timestamp: new Date().toISOString()
  });
});

// Missing parameter error
router.get('/missing-param', (req, res) => {
  const dbError = new Error('Missing parameter in prepared statement');
  dbError.code = 'MISSING_PARAM';
  dbError.details = 'Not enough parameters provided for the prepared statement';
  dbError.query = 'SELECT * FROM users WHERE id = ? AND status = ?';
  dbError.params = [10]; // Missing second parameter
  dbError.database = 'SQL';
  
  logger.error('Missing parameter error', {
    error: dbError.message,
    code: dbError.code,
    details: dbError.details,
    query: dbError.query,
    params: dbError.params,
    database: dbError.database,
    stack: dbError.stack
  });
  
  metrics.trackDetailedError('database', 'parameter', dbError.code);
  
  res.status(500).json({
    error: dbError.message,
    code: dbError.code,
    details: dbError.details,
    query: dbError.query,
    params: dbError.params,
    database: dbError.database,
    timestamp: new Date().toISOString()
  });
});

// Oracle ORA-01652: Unable to extend temp segment
router.get('/ora-01652', (req, res) => {
  const dbError = new Error('ORA-01652: unable to extend temp segment by 128 in tablespace TEMP');
  dbError.code = 'ORA-01652';
  dbError.details = 'Oracle database temporary tablespace out of space during operation';
  dbError.query = 'SELECT u.*, p.* FROM users u JOIN posts p ON u.id = p.user_id ORDER BY p.created_at DESC';
  dbError.params = [];
  dbError.database = 'Oracle';
  
  logger.error('Oracle temp segment error', {
    error: dbError.message,
    code: dbError.code,
    details: dbError.details,
    query: dbError.query,
    params: dbError.params,
    database: dbError.database,
    stack: dbError.stack
  });
  
  metrics.trackDetailedError('database', 'oracle', dbError.code);
  
  res.status(500).json({
    error: dbError.message,
    code: dbError.code,
    details: dbError.details,
    query: dbError.query,
    params: dbError.params,
    database: dbError.database,
    timestamp: new Date().toISOString()
  });
});

// Foreign key constraint error
router.get('/foreign-key', (req, res) => {
  const dbError = new Error('Foreign key constraint failed');
  dbError.code = 'FOREIGN_KEY_ERROR';
  dbError.details = 'Cannot add or update a child row: a foreign key constraint fails';
  dbError.query = 'INSERT INTO posts (id, user_id, title) VALUES (?, ?, ?)';
  dbError.params = [101, 999, 'New Post']; // user_id 999 doesn't exist
  dbError.database = 'SQL';
  
  logger.error('Foreign key constraint error', {
    error: dbError.message,
    code: dbError.code,
    details: dbError.details,
    query: dbError.query,
    params: dbError.params,
    database: dbError.database,
    stack: dbError.stack
  });
  
  metrics.trackDetailedError('database', 'constraint', dbError.code);
  
  res.status(500).json({
    error: dbError.message,
    code: dbError.code,
    details: dbError.details,
    query: dbError.query,
    params: dbError.params,
    database: dbError.database,
    timestamp: new Date().toISOString()
  });
});

// Slow database query
router.get('/slow-query', (req, res) => {
  logger.warn('Slow database query initiated');
  
  // Start tracking database query time
  const startTime = Date.now();
  
  // Simulate a very slow database query
  setTimeout(() => {
    logger.info('Slow database query completed');
    
    // Track slow database query metrics
    const duration = (Date.now() - startTime) / 1000;
    metrics.trackDatabaseQuery('complex', 'aggregation', duration);
    
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