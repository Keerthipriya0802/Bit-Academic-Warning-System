const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      // Get token from header
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ 
          error: 'Access denied. No token provided.' 
        });
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user
      const user = await User.findById(decoded.userId);
      
      if (!user || !user.isActive) {
        return res.status(401).json({ 
          error: 'User not found or inactive' 
        });
      }

      // Check role permissions
      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        return res.status(403).json({ 
          error: 'Insufficient permissions for this action' 
        });
      }

      // Attach user to request
      req.user = user;
      req.userId = user._id;
      req.role = user.role;
      
      // Update last login
      user.lastLogin = new Date();
      await user.save();
      
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          error: 'Invalid token' 
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Token expired' 
        });
      }
      
      res.status(401).json({ 
        error: 'Authentication failed' 
      });
    }
  };
};

module.exports = { auth };