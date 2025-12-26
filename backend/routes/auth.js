/**
 * CURIO BACKEND - Auth Routes
 * Authentication Endpoints: Signup, Login, Logout
 */

const express = require('express');
const router = express.Router();

const { supabase } = require('../config/db');
const { isPremium } = require('../config/supabase');
const { requireAuth } = require('../middleware/auth');
const { ValidationError, UnauthorizedError } = require('../middleware/error');

// =====================================================
// INPUT VALIDATION
// =====================================================

/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate password strength
 */
function isValidPassword(password) {
    return password && password.length >= 6;
}

/**
 * Sanitize and validate auth input
 */
function validateAuthInput(email, password) {
    if (!email || !password) {
        throw new ValidationError('Email and password are required');
    }
    
    if (!isValidEmail(email)) {
        throw new ValidationError('Invalid email format');
    }
    
    if (!isValidPassword(password)) {
        throw new ValidationError('Password must be at least 6 characters');
    }
    
    return {
        email: email.trim().toLowerCase(),
        password: password
    };
}

// =====================================================
// ROUTES
// =====================================================

/**
 * POST /api/auth/signup
 * Create new user account
 * 
 * Body: { email, password }
 * Returns: { user, session }
 */
router.post('/signup', async (req, res, next) => {
    try {
        const { email, password } = validateAuthInput(
            req.body.email,
            req.body.password
        );
        
        // Create user with Supabase Auth
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    // Optional: Additional user metadata
                    created_via: 'curio_backend'
                }
            }
        });
        
        if (error) {
            // Handle specific errors
            if (error.message.includes('already registered')) {
                throw new ValidationError('Email already in use');
            }
            
            if (error.message.includes('Password')) {
                throw new ValidationError(error.message);
            }
            
            throw error;
        }
        
        if (!data.user || !data.session) {
            throw new Error('Signup failed - no user or session returned');
        }
        
        // Check premium status
        const premium = await isPremium(email);
        
        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            data: {
                user: {
                    id: data.user.id,
                    email: data.user.email,
                    created_at: data.user.created_at
                },
                session: {
                    access_token: data.session.access_token,
                    refresh_token: data.session.refresh_token,
                    expires_in: data.session.expires_in,
                    expires_at: data.session.expires_at
                },
                isPremium: premium
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/auth/login
 * Login existing user
 * 
 * Body: { email, password }
 * Returns: { user, session }
 */
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = validateAuthInput(
            req.body.email,
            req.body.password
        );
        
        // Sign in with Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) {
            // Handle specific errors
            if (error.message.includes('Invalid')) {
                throw new UnauthorizedError('Invalid email or password');
            }
            
            throw error;
        }
        
        if (!data.user || !data.session) {
            throw new UnauthorizedError('Login failed');
        }
        
        // Check premium status
        const premium = await isPremium(email);
        
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: data.user.id,
                    email: data.user.email,
                    last_sign_in_at: data.user.last_sign_in_at
                },
                session: {
                    access_token: data.session.access_token,
                    refresh_token: data.session.refresh_token,
                    expires_in: data.session.expires_in,
                    expires_at: data.session.expires_at
                },
                isPremium: premium
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/auth/logout
 * Logout current user
 * Requires: Authentication
 * 
 * Returns: { success: true }
 */
router.post('/logout', requireAuth, async (req, res, next) => {
    try {
        // Get token from request
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            throw new UnauthorizedError('No token provided');
        }
        
        // Sign out with Supabase
        // Note: We use admin API to invalidate token
        const { error } = await supabase.auth.admin.signOut(token);
        
        if (error) {
            console.warn('Logout error:', error.message);
            // Don't throw - logout should always succeed client-side
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
 * GET /api/auth/session
 * Validate current session / token
 * Requires: Authentication
 * 
 * Returns: { user, valid: true }
 */
router.get('/session', requireAuth, async (req, res, next) => {
    try {
        const user = req.user;
        
        res.json({
            success: true,
            valid: true,
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    isPremium: user.isPremium
                }
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 * 
 * Body: { refresh_token }
 * Returns: { session }
 */
router.post('/refresh', async (req, res, next) => {
    try {
        const { refresh_token } = req.body;
        
        if (!refresh_token) {
            throw new ValidationError('Refresh token required');
        }
        
        // Refresh session with Supabase
        const { data, error } = await supabase.auth.refreshSession({
            refresh_token
        });
        
        if (error) {
            throw new UnauthorizedError('Invalid or expired refresh token');
        }
        
        if (!data.session) {
            throw new UnauthorizedError('Failed to refresh session');
        }
        
        res.json({
            success: true,
            message: 'Token refreshed',
            data: {
                session: {
                    access_token: data.session.access_token,
                    refresh_token: data.session.refresh_token,
                    expires_in: data.session.expires_in,
                    expires_at: data.session.expires_at
                }
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;