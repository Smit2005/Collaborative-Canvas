const jwt = require("jsonwebtoken");
const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || "dev_secret_change_me"; // fallback for local dev
  return jwt.sign({ id }, secret, {
    expiresIn: "30d",
  });
};
module.exports = generateToken;
