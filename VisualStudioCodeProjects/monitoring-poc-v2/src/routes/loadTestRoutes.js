const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { metrics } = require('../utils/metrics');

// High CPU usage route - simulates CPU intensive operation
router.get('/cpu-intensive', (req, res) => {
  logger.info('CPU intensive endpoint called');
  
  // Time to calculate prime numbers (CPU intensive)
  const start = Date.now();
  const primes = findPrimes(10000);
  const duration = Date.now() - start;
  
  logger.info('CPU intensive operation completed', { 
    duration: `${duration}ms`,
    primeCount: primes.length
  });
  
  res.json({ 
    message: 'CPU intensive operation completed',
    duration: `${duration}ms`,
    primeCount: primes.length,
    timestamp: new Date().toISOString()
  });
});

// Memory intensive route - allocates a large array in memory
router.get('/memory-intensive', (req, res) => {
  logger.info('Memory intensive endpoint called');
  
  // Create a large array to consume memory
  const size = 100000;
  const largeArray = new Array(size).fill(0).map((_, i) => ({ 
    id: i, 
    data: `This is item ${i} with some extra data to consume more memory`
  }));
  
  logger.info('Memory intensive operation completed', { 
    arraySize: size,
    memorySizeEstimate: `~${(size * 100) / 1024} KB`
  });
  
  res.json({ 
    message: 'Memory intensive operation completed',
    arraySize: size,
    firstItem: largeArray[0],
    lastItem: largeArray[largeArray.length - 1],
    timestamp: new Date().toISOString()
  });
});

// Simulates random response times
router.get('/random-latency', async (req, res) => {
  const delay = Math.floor(Math.random() * 2000); // 0-2000 ms delay
  logger.info('Random latency endpoint called', { delay: `${delay}ms` });
  
  await new Promise(resolve => setTimeout(resolve, delay));
  
  res.json({ 
    message: 'Random latency response',
    delay: `${delay}ms`,
    timestamp: new Date().toISOString()
  });
});

// 1. Extreme CPU Load - Fibonacci with recursion (very inefficient)
router.get('/extreme-cpu', (req, res) => {
  logger.info('Extreme CPU load endpoint called');
  
  const n = 40; // High enough to cause significant CPU load
  const start = Date.now();
  
  // Intentionally inefficient recursive Fibonacci implementation
  const result = fibonacci(n);
  const duration = (Date.now() - start) / 1000; // Convert to seconds
  
  // Record fibonacci duration metric
  metrics.fibonacciDuration.observe({ input: n.toString() }, duration);
  
  logger.info('Extreme CPU operation completed', { 
    duration: `${duration}s`,
    input: n,
    result: result
  });
  
  res.json({ 
    message: 'Extreme CPU operation completed',
    duration: `${duration}s`,
    input: n,
    result: result,
    timestamp: new Date().toISOString()
  });
});

// 2. Memory Leak Simulation
let leakyArray = [];
router.get('/memory-leak', (req, res) => {
  logger.info('Memory leak simulation endpoint called');
  
  // Add 1 million objects to the global array
  const itemsToAdd = 1000000;
  const before = process.memoryUsage().heapUsed / 1024 / 1024;
  
  for (let i = 0; i < itemsToAdd; i++) {
    leakyArray.push({
      id: i + leakyArray.length,
      timestamp: Date.now(),
      data: `Memory leak item with random data: ${Math.random().toString(36).substring(2, 15)}`
    });
  }
  
  const after = process.memoryUsage().heapUsed / 1024 / 1024;
  const increased = after - before;
  
  // Update memory leak metrics
  metrics.memoryLeakItemsGauge.set(leakyArray.length);
  metrics.memoryLeakGauge.set(process.memoryUsage().heapUsed);
  
  logger.warn('Memory leak simulation added items', { 
    itemsAdded: itemsToAdd,
    totalItems: leakyArray.length,
    memoryBeforeMB: before.toFixed(2),
    memoryAfterMB: after.toFixed(2),
    increasedMB: increased.toFixed(2)
  });
  
  res.json({ 
    message: 'Memory leak simulation',
    itemsAdded: itemsToAdd,
    totalItems: leakyArray.length,
    memoryIncreaseMB: increased.toFixed(2),
    timestamp: new Date().toISOString()
  });
});

// Reset memory leak
router.get('/reset-memory-leak', (req, res) => {
  const before = leakyArray.length;
  leakyArray = [];
  global.gc && global.gc(); // Force garbage collection if available
  
  // Reset memory leak metrics
  metrics.memoryLeakItemsGauge.set(0);
  metrics.memoryLeakGauge.set(process.memoryUsage().heapUsed);
  
  logger.info('Memory leak reset', { itemsCleared: before });
  
  res.json({ 
    message: 'Memory leak has been reset',
    itemsCleared: before,
    timestamp: new Date().toISOString()
  });
});

// 3. Heavy I/O Operations
router.get('/heavy-io', async (req, res) => {
  logger.info('Heavy I/O operations endpoint called');
  const iterations = 100;
  const start = Date.now();
  
  try {
    // Simulate multiple file system operations
    for (let i = 0; i < iterations; i++) {
      // Simulate reading and writing files by forcing timeouts
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    const duration = (Date.now() - start) / 1000; // Convert to seconds
    
    // Record IO operations duration metric
    metrics.ioOperationsDuration.observe({ iterations: iterations.toString() }, duration);
    
    logger.info('Heavy I/O operations completed', { 
      iterations,
      duration: `${duration}s`
    });
    
    res.json({ 
      message: 'Heavy I/O operations completed',
      iterations,
      duration: `${duration}s`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error during I/O operations', { error: error.message });
    res.status(500).json({ 
      error: 'I/O operation failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 4. Complex Database Query - joins multiple tables with sorting and filtering
router.get('/complex-query', (req, res) => {
  logger.info('Complex database query endpoint called');
  const start = Date.now();
  
  setTimeout(() => {
    try {
      // Simulating a complex database query with multiple joins, sorting, and aggregations
      const result = simulateComplexQuery();
      const duration = (Date.now() - start) / 1000; // Convert to seconds
      
      // Record complex query duration metric
      metrics.complexQueryDuration.observe(duration);
      
      logger.info('Complex database query completed', { 
        duration: `${duration}s`,
        resultCount: result.length
      });
      
      res.json({ 
        message: 'Complex database query completed',
        duration: `${duration}s`,
        resultCount: result.length,
        results: result.slice(0, 5), // Only return first 5 results
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Error during complex query', { error: error.message });
      res.status(500).json({ 
        error: 'Complex query failed',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }, 4000); // Simulate a 4 second query execution time
});

// 5. Concurrent Workload - simulates multiple operations happening simultaneously
router.get('/concurrent-workload', async (req, res) => {
  logger.info('Concurrent workload endpoint called');
  const start = Date.now();
  
  try {
    // Run multiple operations concurrently
    await Promise.all([
      // CPU workload
      new Promise(resolve => {
        findPrimes(5000);
        resolve();
      }),
      
      // Memory workload
      new Promise(resolve => {
        const arr = new Array(50000).fill(0).map((_, i) => ({ id: i, data: `Data ${i}` }));
        resolve();
      }),
      
      // I/O workload
      new Promise(resolve => {
        setTimeout(resolve, 2000);
      }),
      
      // Database simulation workload
      new Promise(resolve => {
        simulateComplexQuery();
        resolve();
      })
    ]);
    
    const duration = (Date.now() - start) / 1000; // Convert to seconds
    
    // Record concurrent workload duration metric
    metrics.concurrentWorkloadDuration.observe(duration);
    
    logger.info('Concurrent workload completed', { 
      duration: `${duration}s`
    });
    
    res.json({ 
      message: 'Concurrent workload completed',
      duration: `${duration}s`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error during concurrent workload', { error: error.message });
    res.status(500).json({ 
      error: 'Concurrent workload failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Helper function to find prime numbers
function findPrimes(max) {
  const primes = [];
  
  for (let num = 2; num <= max; num++) {
    let isPrime = true;
    for (let i = 2; i <= Math.sqrt(num); i++) {
      if (num % i === 0) {
        isPrime = false;
        break;
      }
    }
    if (isPrime) {
      primes.push(num);
    }
  }
  
  return primes;
}

// Recursive fibonacci implementation (intentionally inefficient)
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

// Simulate a complex database query with joins and aggregations
function simulateComplexQuery() {
  // Simulated database tables
  const users = Array.from({ length: 1000 }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    role: i % 10 === 0 ? 'admin' : 'user',
    createdAt: new Date(Date.now() - Math.random() * 10000000000)
  }));
  
  const posts = Array.from({ length: 5000 }, (_, i) => ({
    id: i + 1,
    userId: Math.floor(Math.random() * 1000) + 1,
    title: `Post ${i + 1}`,
    views: Math.floor(Math.random() * 10000),
    createdAt: new Date(Date.now() - Math.random() * 5000000000)
  }));
  
  const comments = Array.from({ length: 20000 }, (_, i) => ({
    id: i + 1,
    postId: Math.floor(Math.random() * 5000) + 1,
    userId: Math.floor(Math.random() * 1000) + 1,
    content: `Comment ${i + 1}`,
    createdAt: new Date(Date.now() - Math.random() * 2000000000)
  }));
  
  // Perform CPU-intensive operations to simulate a complex query
  
  // 1. Join posts with users (author information)
  const postsWithAuthors = posts.map(post => {
    const author = users.find(user => user.id === post.userId);
    return { ...post, author };
  });
  
  // 2. Join posts with comments
  const postsWithComments = postsWithAuthors.map(post => {
    const postComments = comments.filter(comment => comment.postId === post.id);
    
    // Join comments with users
    const commentsWithAuthors = postComments.map(comment => {
      const commentAuthor = users.find(user => user.id === comment.userId);
      return { ...comment, author: commentAuthor };
    });
    
    return { ...post, comments: commentsWithAuthors };
  });
  
  // 3. Calculate engagement metrics for each post
  const postsWithEngagement = postsWithComments.map(post => {
    const commentCount = post.comments.length;
    const uniqueCommenters = new Set(post.comments.map(c => c.userId)).size;
    const latestCommentDate = post.comments.length 
      ? new Date(Math.max(...post.comments.map(c => c.createdAt.getTime())))
      : null;
    
    return {
      ...post,
      engagement: {
        commentCount,
        uniqueCommenters,
        latestCommentDate,
        engagementScore: commentCount * 2 + uniqueCommenters * 5 + post.views / 100
      }
    };
  });
  
  // 4. Filter, sort and return results
  return postsWithEngagement
    .filter(post => post.engagement.commentCount > 0)
    .sort((a, b) => b.engagement.engagementScore - a.engagement.engagementScore);
}

module.exports = router; 