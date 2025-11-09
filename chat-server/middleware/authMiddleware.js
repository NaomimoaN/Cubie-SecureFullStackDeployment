import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";

const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Read the JWT from the httpOnly cookie
  token = req.cookies.jwt;

  if (token) {
    try {
      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // console.log("Decoded JWT payload:", decoded);

      // Attach the decoded payload directly to the request object.
      // I trust the main server's token. No need to query the DB here.
      req.user = {
        _id: decoded.id,
        role: decoded.role,
      };

      next();
    } catch (error) {
      console.error("Token verification failed in chat-server:", error);
      res.status(401);
      throw new Error("Not authorized, token failed");
    }
  } else {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
});

export { protect };
