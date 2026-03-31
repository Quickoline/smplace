import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "change_me_in_production";

export const authenticate = (req, res, next) => {
  let authHeader = req.headers.authorization;
  const rawAlt =
    req.headers["x-auth-token"] || req.headers["x-access-token"];
  const alt = Array.isArray(rawAlt) ? rawAlt[0] : rawAlt;
  if ((!authHeader || !authHeader.startsWith("Bearer ")) && alt) {
    authHeader = `Bearer ${String(alt).trim()}`;
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization token missing" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
};
