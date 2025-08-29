const jwt = require('jsonwebtoken');
const { User } = require('../models');

exports.protect = async (req, res, next) => {
    let token;

    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    } 
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user || user.session_token !== decoded.session_token) {
            return res.status(401).json({ message: 'Session expired or logged in elsewhere.' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

exports.protectPage = (redirectTo) => {
    return async (req, res, next) => {
        let token;
        if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.redirect(redirectTo);
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id);
            
            if (!user || user.session_token !== decoded.session_token) {
                res.clearCookie('token');
                return res.redirect(redirectTo);
            }

            req.user = user;
            next();
        } catch (error) {
            res.clearCookie('token');
            return res.redirect(redirectTo);
        }
    };
};

exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            if (req.accepts('html')) {
                return res.redirect('/student-login.html'); 
            }
            return res.status(403).json({ message: `User role ${req.user.role} is not authorized to access this route` });
        }
        next();
    };
};