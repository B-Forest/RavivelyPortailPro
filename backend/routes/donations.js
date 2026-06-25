const express = require("express");
const Donation = require("../models/Donation");
const { requireAuth, requireAssociation } = require("../middleware/auth");

const router = express.Router();

// POST /api/donations — Déclarer un nouveau don (association uniquement)
router.post("/", requireAuth, requireAssociation, async (req, res) => {
  try {
    const associationId = req.user.associationId;
    if (!associationId) {
      return res.status(400).json({ message: "Aucune association rattachée à ce compte." });
    }

    const { title, description, category, quantity, unit, expirationDate, allergens, pickupInstructions } = req.body;

    const donation = await Donation.create({
      associationId,
      title,
      description,
      category,
      quantity,
      unit,
      expirationDate,
      allergens,
      pickupInstructions,
      status: "available"
    });

    res.status(201).json({ donation });
  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(" "), errors: messages });
    }
    res.status(500).json({ message: "Erreur lors de la création du don.", error: err.message });
  }
});

// GET /api/donations/association/:id — Liste des dons d'une association (tableau de bord)
router.get("/association/:id", requireAuth, requireAssociation, async (req, res) => {
  try {
    if (String(req.user.associationId) !== req.params.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Accès interdit à cette association." });
    }

    const donations = await Donation.find({ associationId: req.params.id }).sort({ createdAt: -1 });

    const stats = {
      totalDonations: donations.length,
      availableDonations: donations.filter((d) => d.status === "available").length,
      collectedDonations: donations.filter((d) => d.status === "collected").length
    };

    res.json({ donations, stats });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la récupération des dons.", error: err.message });
  }
});

// PATCH /api/donations/:id/status — Mettre à jour le statut d'un don
router.patch("/:id/status", requireAuth, requireAssociation, async (req, res) => {
  try {
    const { status } = req.body;
    const donation = await Donation.findOne({ _id: req.params.id, associationId: req.user.associationId });
    if (!donation) {
      return res.status(404).json({ message: "Don introuvable." });
    }
    donation.status = status;
    await donation.save();
    res.json({ donation });
  } catch (err) {
    res.status(400).json({ message: "Erreur lors de la mise à jour du statut.", error: err.message });
  }
});

// DELETE /api/donations/:id — Annuler/supprimer un don
router.delete("/:id", requireAuth, requireAssociation, async (req, res) => {
  try {
    const donation = await Donation.findOneAndDelete({ _id: req.params.id, associationId: req.user.associationId });
    if (!donation) {
      return res.status(404).json({ message: "Don introuvable." });
    }
    res.json({ message: "Don supprimé." });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la suppression.", error: err.message });
  }
});

module.exports = router;
