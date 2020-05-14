// to get a token from a request and proceeds only when the token is validated
const jwt = require('jsonwebtoken');
const jwtSecret = require('./jwtSecret');

let checkToken = (req, res, next) => {
	let token = req.cookies.auth || req.body.token || req.headers['token'];

	if (token) {
		jwt.verify(token, jwtSecret.secret, (err, decoded) => {
			if (err) {
				res.status(500).send('Token is invalid');
			} else {
				req.decoded = decoded;
				next();
			}
		});
	} else {
		res.status(401).send('No token is provided.');
	}
};

module.exports = checkToken;
