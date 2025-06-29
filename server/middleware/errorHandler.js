function errorHandler(err, req, res, next) {
    console.error(err.stack); // Log the error stack for debugging

    // Default to a 500 Internal Server Error
    const statusCode = err.statusCode || 500;
    const message = err.message || 'An unexpected error occurred.';

    res.status(statusCode).json({
        success: false,
        error: message
    });
}

module.exports = errorHandler;