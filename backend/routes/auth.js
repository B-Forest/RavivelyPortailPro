const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Association = require("../models/Association");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });
}

function sendTokenCookie(res, token) {
  const cookieName = process.env.COOKIE_NAME || "ravively_token";
  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

// POST /api/auth/register-association
// Crée en une fois l'association + le compte utilisateur "association" rattaché
router.post("/register-association", async (req, res) => {
  try {
    const { associationName, email, password, firstname, lastname, phone, address, city, postalCode, siret } = req.body;

    if (!associationName || !email || !password || !firstname || !lastname) {
      return res.status(400).json({ message: "Tous les champs obligatoires ne sont pas renseignés." });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Un compte existe déjà avec cet email." });
    }

    const association = await Association.create({
      name: associationName,
      email,
      phone,
      address,
      city,
      postalCode,
      siret
    });

    const user = await User.create({
      firstname,
      lastname,
      email,
      password,
      role: "association",
      associationId: association._id
    });

    const token = signToken(user);
    sendTokenCookie(res, token);

    res.status(201).json({
      token,
      user: { id: user._id, firstname, lastname, email, role: user.role, associationId: association._id },
      association
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la création du compte.", error: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email et mot de passe requis." });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect." });
    }

    const token = signToken(user);
    sendTokenCookie(res, token);

    res.json({
      token,
      user: {
        id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
        associationId: user.associationId
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la connexion.", error: err.message });
  }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  const cookieName = process.env.COOKIE_NAME || "ravively_token";
  res.clearCookie(cookieName);
  res.json({ message: "Déconnecté." });
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      firstname: req.user.firstname,
      lastname: req.user.lastname,
      email: req.user.email,
      role: req.user.role,
      associationId: req.user.associationId
    }
  });
});

module.exports = router;
