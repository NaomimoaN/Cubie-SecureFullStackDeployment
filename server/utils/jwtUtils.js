import jwt from "jsonwebtoken";

const generateToken = (id, role) => {
  const payload = { id, role };
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_TOKEN_EXPIRES_IN,
  });
};

export default generateToken;
