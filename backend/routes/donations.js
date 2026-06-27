const express = require("express");
const Donation = require("../models/Donation");
const { requireAuth, requireAssociation } = require("../middleware/auth");

const router = express.Router();

// POST /api/donations/bulk — Importer plusieurs dons en une fois
router.post("/bulk", requireAuth, requireAssociation, async (req, res) => {
  try {
    const associationId = req.user.associationId;
    if (!associationId) {
      return res.status(400).json({ message: "Aucune association rattachée à ce compte." });
    }

    const { donations: rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ message: "Aucune ligne à importer." });
    }
    if (rows.length > 200) {
      return res.status(400).json({ message: "Maximum 200 dons par import." });
    }

    const created = [];
    const failed = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const donation = await Donation.create({
          associationId,
          title: row.title,
          description: row.description,
          category: row.category,
          quantity: row.quantity,
          unit: row.unit,
          expirationDate: row.expirationDate,
          allergens: row.allergens || [],
          pickupInstructions: row.pickupInstructions,
          status: "available"
        });
        created.push(donation);
      } catch (err) {
        const messages = err.name === "ValidationError"
          ? Object.values(err.errors).map((e) => e.message)
          : [err.message];
        failed.push({ row: i + 1, errors: messages });
      }
    }

    res.status(201).json({
      created: created.length,
      failed: failed.length,
      errors: failed
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de l'import en masse.", error: err.message });
  }
});

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

// PUT /api/donations/:id — Modifier un don existant (association propriétaire uniquement)
router.put("/:id", requireAuth, requireAssociation, async (req, res) => {
  try {
    const donation = await Donation.findOne({ _id: req.params.id, associationId: req.user.associationId });
    if (!donation) {
      return res.status(404).json({ message: "Don introuvable." });
    }

    const { title, description, category, quantity, unit, expirationDate, allergens, pickupInstructions } = req.body;

    donation.title = title ?? donation.title;
    donation.description = description ?? donation.description;
    donation.category = category ?? donation.category;
    donation.quantity = quantity ?? donation.quantity;
    donation.unit = unit ?? donation.unit;
    donation.expirationDate = expirationDate ?? donation.expirationDate;
    donation.allergens = allergens ?? donation.allergens;
    donation.pickupInstructions = pickupInstructions ?? donation.pickupInstructions;

    await donation.save();
    res.json({ donation });
  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(" "), errors: messages });
    }
    res.status(500).json({ message: "Erreur lors de la modification du don.", error: err.message });
  }
});

// GET /api/donations/:id — Récupérer un don précis (pour pré-remplir le formulaire d'édition)
router.get("/:id", requireAuth, requireAssociation, async (req, res) => {
  try {
    const donation = await Donation.findOne({ _id: req.params.id, associationId: req.user.associationId });
    if (!donation) {
      return res.status(404).json({ message: "Don introuvable." });
    }
    res.json({ donation });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors de la récupération du don.", error: err.message });
  }
});

// GET /api/donations/association/:id/stats — Statistiques détaillées (page Stats)
router.get("/association/:id/stats", requireAuth, requireAssociation, async (req, res) => {
  try {
    if (String(req.user.associationId) !== req.params.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Accès interdit à cette association." });
    }

    const donations = await Donation.find({ associationId: req.params.id });

    const totalDonations = donations.length;
    const byStatus = {};
    const byCategory = {};
    const quantityByUnit = {}; // ex: { kg: 80, portion: 15, litre: 0 }
    const quantitySavedByUnit = {}; // uniquement les dons "collected"

    for (const d of donations) {
      byStatus[d.status] = (byStatus[d.status] || 0) + 1;
      byCategory[d.category] = (byCategory[d.category] || 0) + 1;
      quantityByUnit[d.unit] = (quantityByUnit[d.unit] || 0) + d.quantity;
      if (d.status === "collected") {
        quantitySavedByUnit[d.unit] = (quantitySavedByUnit[d.unit] || 0) + d.quantity;
      }
    }

    // Estimation simple : 1 kg ~ 2.5 repas, 1 portion = 1 repas, 1 litre ~ 1 repas (indicatif)
    const mealsEstimate = Math.round(
      (quantitySavedByUnit.kg || 0) * 2.5 + (quantitySavedByUnit.portion || 0) + (quantitySavedByUnit.litre || 0)
    );

    res.json({
      totalDonations,
      byStatus,
      byCategory,
      quantityByUnit,
      quantitySavedByUnit,
      mealsEstimate
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur lors du calcul des statistiques.", error: err.message });
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
