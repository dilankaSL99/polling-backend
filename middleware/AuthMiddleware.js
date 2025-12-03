//Runs before the Controller. It checks JWT Token. If valid, it adds userId to req object.
//Ensures that no one could delete polls or view private data unless they are who they say they are.
const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET;

const authenticateToken = (req, res, next) => {
  
  //Get the token from the request header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  //If no token, return 401 Unauthorized
  if (token == null) {
    return res.status(401).json({ message: 'No token provided.' });
  }
  
  //Verify the token
  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      // If token is invalid, return 403 Forbidden
      return res.status(403).json({ message: 'Invalid token.' });
    }

    //If token is valid, store userId in request object for use in controllers
    req.userId = decoded.userId;
    next();
  });
};

//Export the authenticateToken
module.exports = authenticateToken;