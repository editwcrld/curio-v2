/**
 * CURIO BACKEND - Error Handler Middleware
 * Zentrale Fehlerbehandlung für alle Routes
 * 
 * Fängt alle Errors ab und sendet konsistente Responses
 */

/**
 * Error Handler Middleware
 * WICHTIG: Muss 4 Parameter haben! (err, req, res, next)
 * 
 * @param {Error} err - Error Object
 * @param {object} req - Express Request
 * @param {object} res - Express Response
 * @param {function} next - Next Function
 */
function errorHandler(err, req, res, next) {
    // Log error
    console.error('❌ Error occurred:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });
    
    // Determine status code
    const statusCode = err.statusCode || err.status || 500;
    
    // Base error response
    const errorResponse = {
        error: true,
        message: err.message || 'Internal Server Error',
        path: req.path,
        timestamp: new Date().toISOString()
    };
    
    // Add stack trace in development
    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = err.stack;
        errorResponse.details = err.details || null;
    }
    
    // Send error response
    res.status(statusCode).json(errorResponse);
}

/**
 * 404 Not Found Handler
 * Für Routes die nicht existieren
 */
function notFoundHandler(req, res, next) {
    const error = new Error(`Route ${req.method} ${req.path} not found`);
    error.statusCode = 404;
    next(error);
}

/**
 * Async Error Wrapper
 * Wraps async route handlers to catch errors
 * 
 * Usage:
 * app.get('/api/test', asyncHandler(async (req, res) => {
 *     const data = await fetchData(); // Throws error? → Error Handler!
 *     res.json(data);
 * }));
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

/**
 * Custom Error Classes
 */
class ValidationError extends Error {
    constructor(message, details = null) {
        super(message);
        this.name = 'ValidationError';
        this.statusCode = 400;
        this.details = details;
    }
}

class UnauthorizedError extends Error {
    constructor(message = 'Unauthorized') {
        super(message);
        this.name = 'UnauthorizedError';
        this.statusCode = 401;
    }
}

class ForbiddenError extends Error {
    constructor(message = 'Forbidden') {
        super(message);
        this.name = 'ForbiddenError';
        this.statusCode = 403;
    }
}

class NotFoundError extends Error {
    constructor(message = 'Not Found') {
        super(message);
        this.name = 'NotFoundError';
        this.statusCode = 404;
    }
}

class RateLimitError extends Error {
    constructor(message = 'Rate limit exceeded') {
        super(message);
        this.name = 'RateLimitError';
        this.statusCode = 429;
    }
}

module.exports = {
    errorHandler,
    notFoundHandler,
    asyncHandler,
    // Error Classes
    ValidationError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    RateLimitError
};