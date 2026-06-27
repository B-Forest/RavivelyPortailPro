const express = require("express");
const Association = require("../models/Association");
const { requireAuth, requireAssociation } = require("../middleware/auth");

const router = express.Router();

// GET /api/associations/me — Récupérer le profil de l'association connectée
router.get("/me", requireAuth, requireAssociation, async (req, res) => {
  try {
    const association = await Association.findById(req.user.associationId);
    if (!association) {
      return res.status(404).json({ message: "Association introuvable." });
    }
    res.json({ association });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la récupération du profil.", error: err.message });
  }
});

// PUT /api/associations/me — Modifier le profil de l'association connectée
router.put("/me", requireAuth, requireAssociation, async (req, res) => {
  try {
    const { name, email, phone, address, city, postalCode, siret } = req.body;

    const association = await Association.findById(req.user.associationId);
    if (!association) {
      return res.status(404).json({ message: "Association introuvable." });
    }

    association.name = name ?? association.name;
    association.email = email ?? association.email;
    association.phone = phone ?? association.phone;
    association.address = address ?? association.address;
    association.city = city ?? association.city;
    association.postalCode = postalCode ?? association.postalCode;
    association.siret = siret ?? association.siret;

    await association.save();
    res.json({ association });
  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(" "), errors: messages });
    }
    res.status(500).json({ message: "Erreur lors de la mise à jour du profil.", error: err.message });
  }
});

module.exports = router;
