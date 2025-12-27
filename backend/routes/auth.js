/**
 * CURIO BACKEND - Auth Routes
 * Login, Signup, Logout mit Supabase Auth
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/db');
const { ValidationError } = require('../middleware/error');

// =====================================================
// VALIDATION HELPERS
// =====================================================

/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate signup input (WITH password length check)
 */
function validateSignupInput(email, password) {
    if (!email || !password) {
        throw new ValidationError('Email and password are required');
    }
    
    if (!isValidEmail(email)) {
        throw new ValidationError('Invalid email format');
    }
    
    // ✅ Password length check ONLY for signup
    if (password.length < 6) {
        throw new ValidationError('Password must be at least 6 characters');
    }
}

/**
 * Validate login input (NO password length check)
 */
function validateLoginInput(email, password) {
    if (!email || !password) {
        throw new ValidationError('Email and password are required');
    }
    
    if (!isValidEmail(email)) {
        throw new ValidationError('Invalid email format');
    }
    
    // ✅ NO password length check for login - let Supabase handle wrong credentials
}

// =====================================================
// ROUTES
// =====================================================

/**
 * POST /api/auth/signup
 * Register new user
 */
router.post('/signup', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        
        // ✅ Use signup validation (with password length check)
        validateSignupInput(email, password);
        
        const { data, error } = await supabase.auth.signUp({
            email,
            password
        });
        
        if (error) {
            throw new ValidationError(error.message);
        }
        
        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            data: {
                user: data.user ? {
                    id: data.user.id,
                    email: data.user.email
                } : null
            }
        });
        
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/auth/login
 * Login existing user
 */
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;
        
        // ✅ Use login validation (NO password length check)
        validateLoginInput(email, password);
        
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) {
            // ✅ Generic error message for security
            throw new ValidationError('Invalid email or password');
        }
        
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: data.user.id,
                    email: data.user.email
                },
                session: {
                    access_token: data.session.access_token,
                    refresh_token: data.session.refresh_token,
                    expires_at: data.session.expires_at
                }
            }
        });
        
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/auth/logout
 * Logout user (invalidate token)
 */
router.post('/logout', async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            
            // Sign out from Supabase
            await supabase.auth.signOut();
        }
        
        res.json({
            success: true,
            message: 'Logout successful'
        });
        
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }
        
        const token = authHeader.split(' ')[1];
        
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }
        
        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    created_at: user.created_at
                }
            }
        });
        
    } catch (error) {
        next(error);
    }
});

module.exports = router;