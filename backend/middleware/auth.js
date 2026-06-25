const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Vérifie le JWT (cookie ou header Authorization) et attache req.user
async function requireAuth(req, res, next) {
  try {
    const cookieName = process.env.COOKIE_NAME || "ravively_token";
    const tokenFromCookie = req.cookies ? req.cookies[cookieName] : null;
    const tokenFromHeader = req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null;
    const token = tokenFromCookie || tokenFromHeader;

    if (!token) {
      return res.status(401).json({ message: "Authentification requise." });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);
    if (!user) {
      return res.status(401).json({ message: "Utilisateur introuvable." });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Session invalide ou expirée." });
  }
}

// Réservé aux comptes "association" (et admin) — Règle métier du cahier des charges
function requireAssociation(req, res, next) {
  if (!req.user || !["association", "admin"].includes(req.user.role)) {
    return res.status(403).json({
      message: "Accès réservé aux associations. Les particuliers n'ont pas accès au portail Pro."
    });
  }
  next();
}

module.exports = { requireAuth, requireAssociation };
