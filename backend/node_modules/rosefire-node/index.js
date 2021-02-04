var jwt = require('jsonwebtoken');

var AuthData = function(decodedJwt) {
  this.issued_at = decodedJwt.iat;
  this.username = decodedJwt.d.uid;
  this.group = decodedJwt.d.group;
  this.name = decodedJwt.d.name;
  this.expires_at = decodedJwt.exp; 
  this.provider = decodedJwt.d.provider;
  this.email = this.username + "@rose-hulman.edu";
};

var RosefireTokenVerifier = function(secret) {
  if (!secret || typeof secret !== "string") {
    throw new Error("Invalid secret!");
  }
  this.secret = secret;
};

RosefireTokenVerifier.prototype.verify = function(token, callback) {
  if (!callback || typeof callback !== "function") {
    throw new Error("You forgot a callback, or didn't pass in a function!");
  }
  jwt.verify(token, this.secret, function(err, decoded) {
    if (err) {
      callback(err, decoded);
    } else {
      callback(err, new AuthData(decoded));
    }
  });
};

module.exports = RosefireTokenVerifier;
