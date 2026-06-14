const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'smartload_secret_key_2024_secure_random_string_xyz789');
    const user = await User.findById(decoded.id).select('-password');
    if (!user || !user.isActive) return res.status(401).json({ message: 'Token is not valid' });
    req.user = user;
    next();
  } catch (error) { res.status(401).json({ message: 'Token is not valid' }); }
};

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  next();
};

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'smartload_secret_key_2024_secure_random_string_xyz789', { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET || 'smartload_refresh_secret_2024_secure_random_string_abc123', { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

module.exports = { auth, adminOnly, generateTokens };