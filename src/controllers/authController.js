const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const authService = require('../services/authService');
const config = require('../config/env');

// Validation rules
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('name')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Name is required')
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Register a new user
async function register(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.path.startsWith('/api')) {
        return res.status(400).json({ errors: errors.array() });
      }
      return res.render('admin/register', {
        title: 'Register',
        errors: errors.array(),
        values: req.body,
        layout: 'layouts/main'
      });
    }

    const { email, password, name } = req.body;

    // Check if email already exists
    const exists = await User.emailExists(email);
    if (exists) {
      const error = { msg: 'Email already registered' };
      if (req.path.startsWith('/api')) {
        return res.status(400).json({ errors: [error] });
      }
      return res.render('admin/register', {
        title: 'Register',
        errors: [error],
        values: req.body,
        layout: 'layouts/main'
      });
    }

    // Hash password and create user
    const passwordHash = await authService.hashPassword(password);
    const user = await User.create({ email, passwordHash, name });

    // Generate token
    const token = authService.generateToken(user.id);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    if (req.path.startsWith('/api')) {
      return res.status(201).json({
        message: 'Registration successful',
        user: { id: user.id, email: user.email, name: user.name }
      });
    }

    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Registration error:', error);
    if (req.path.startsWith('/api')) {
      return res.status(500).json({ error: 'Registration failed' });
    }
    res.render('admin/register', {
      title: 'Register',
      errors: [{ msg: 'Registration failed. Please try again.' }],
      values: req.body,
      layout: 'layouts/main'
    });
  }
}

// Login user
async function login(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.path.startsWith('/api')) {
        return res.status(400).json({ errors: errors.array() });
      }
      return res.render('admin/login', {
        title: 'Login',
        errors: errors.array(),
        values: req.body,
        layout: 'layouts/main'
      });
    }

    const { email, password } = req.body;

    // Find user - use same error message for both invalid email and password
    const user = await User.findByEmail(email);
    const invalidCredentialsError = { msg: 'Invalid email or password' };

    if (!user) {
      if (req.path.startsWith('/api')) {
        return res.status(401).json({ errors: [invalidCredentialsError] });
      }
      return res.render('admin/login', {
        title: 'Login',
        errors: [invalidCredentialsError],
        values: { email },
        layout: 'layouts/main'
      });
    }

    // Verify password
    const validPassword = await authService.verifyPassword(password, user.password_hash);
    if (!validPassword) {
      if (req.path.startsWith('/api')) {
        return res.status(401).json({ errors: [invalidCredentialsError] });
      }
      return res.render('admin/login', {
        title: 'Login',
        errors: [invalidCredentialsError],
        values: { email },
        layout: 'layouts/main'
      });
    }

    // Generate token
    const token = authService.generateToken(user.id);

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    if (req.path.startsWith('/api')) {
      return res.json({
        message: 'Login successful',
        user: { id: user.id, email: user.email, name: user.name }
      });
    }

    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Login error:', error);
    if (req.path.startsWith('/api')) {
      return res.status(500).json({ error: 'Login failed' });
    }
    res.render('admin/login', {
      title: 'Login',
      errors: [{ msg: 'Login failed. Please try again.' }],
      values: req.body,
      layout: 'layouts/main'
    });
  }
}

// Logout user
function logout(req, res) {
  res.clearCookie('token');
  if (req.path.startsWith('/api')) {
    return res.json({ message: 'Logged out successfully' });
  }
  res.redirect('/admin/login');
}

module.exports = {
  register,
  login,
  logout,
  registerValidation,
  loginValidation
};
