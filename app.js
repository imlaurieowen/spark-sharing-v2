const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const expressLayouts = require('express-ejs-layouts');
const rateLimit = require('express-rate-limit');
const config = require('./src/config/env');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", config.r2.publicUrl || "https://*.r2.dev"].filter(Boolean),
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS
app.use(cors({
  origin: config.nodeEnv === 'production' ? config.baseUrl : true,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: { error: 'Too many requests, please try again later.' }
});
app.use(limiter);

// Request logging
if (config.nodeEnv !== 'test') {
  app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));
}

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Make config available to views
app.use((req, res, next) => {
  res.locals.baseUrl = config.baseUrl;
  res.locals.currentYear = new Date().getFullYear();
  next();
});

// Analytics tracking
const { trackPageViews } = require('./src/middleware/analytics');
app.use(trackPageViews);

// Routes
app.use('/', require('./src/routes'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('errors/404', {
    title: 'Page Not Found',
    layout: 'layouts/main'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  if (req.path.startsWith('/api')) {
    return res.status(err.status || 500).json({
      error: config.nodeEnv === 'production' ? 'Internal server error' : err.message
    });
  }

  res.status(err.status || 500).render('errors/500', {
    title: 'Server Error',
    error: config.nodeEnv === 'production' ? null : err,
    layout: 'layouts/main'
  });
});

module.exports = app;
