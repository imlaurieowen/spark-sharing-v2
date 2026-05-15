const authService = require('../services/authService');
const User = require('../models/User');

async function requireAuth(req, res, next) {
  try {
    // Get token from cookie or Authorization header
    let token = req.cookies.token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      if (req.path.startsWith('/api')) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      return res.redirect('/admin/login');
    }

    // Verify token
    const decoded = authService.verifyToken(token);
    if (!decoded) {
      res.clearCookie('token');
      if (req.path.startsWith('/api')) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
      return res.redirect('/admin/login');
    }

    // Get user
    const user = await User.findById(decoded.userId);
    if (!user) {
      res.clearCookie('token');
      if (req.path.startsWith('/api')) {
        return res.status(401).json({ error: 'User not found' });
      }
      return res.redirect('/admin/login');
    }

    // Attach user to request
    req.user = user;
    res.locals.user = user;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (req.path.startsWith('/api')) {
      return res.status(500).json({ error: 'Authentication error' });
    }
    res.redirect('/admin/login');
  }
}

// Optional auth - doesn't require login but attaches user if logged in
async function optionalAuth(req, res, next) {
  try {
    let token = req.cookies.token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (token) {
      const decoded = authService.verifyToken(token);
      if (decoded) {
        const user = await User.findById(decoded.userId);
        if (user) {
          req.user = user;
          res.locals.user = user;
        }
      }
    }

    next();
  } catch (error) {
    // Silently continue without auth
    next();
  }
}

module.exports = {
  requireAuth,
  optionalAuth
};
