/**
 * Auth Routes
 */

const express = require('express');
const authController = require('../controllers/authController');
const { validateRegister } = require('../middleware/validation');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', validateRegister, authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
