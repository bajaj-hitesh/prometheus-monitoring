const promClient = require('prom-client');

// Create a Registry to register the metrics
const register = new promClient.Registry();

// Add a default label which is added to all metrics
promClient.collectDefaultMetrics({
  app: 'node-api-app',
  prefix: 'api_',
  timeout: 10000,
  register
});

// Create custom metrics
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10] // buckets for response time from 0.1s to 10s
});

const httpRequestCounter = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Register the custom metrics
register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(httpRequestCounter);

// Middleware function to measure request duration and count
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  // Record end time and increment counter when response is finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const route = req.route ? req.route.path : req.path;
    const method = req.method;
    const statusCode = res.statusCode;
    
    // Convert from milliseconds to seconds
    httpRequestDurationMicroseconds
      .labels(method, route, statusCode)
      .observe(duration / 1000);
    
    httpRequestCounter
      .labels(method, route, statusCode)
      .inc();
  });
  
  next();
};

module.exports = {
  register,
  metricsMiddleware
};

// Made with Bob
