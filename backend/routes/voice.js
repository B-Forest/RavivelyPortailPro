const express = require("express");
const { requireAuth, requireAssociation } = require("../middleware/auth");
const donationExtraction = require("../services/donationExtractionService");

const router = express.Router();

router.post("/extract-donation", requireAuth, requireAssociation, async (req, res) => {
  try {
    const { transcription, mode, field, currentForm } = req.body;

    if (!transcription || typeof transcription !== "string" || !transcription.trim()) {
      return res.status(400).json({ message: "Transcription vide ou invalide." });
    }

    const text = transcription.trim();
    const formContext = currentForm && typeof currentForm === "object" ? currentForm : null;

    if (mode === "global") {
      const data = await donationExtraction.extractGlobal(text, formContext);
      return res.json({
        transcription: text,
        mode: "global",
        data,
        formData: donationExtraction.mapGlobalToForm(data)
      });
    }

    if (mode === "field") {
      if (!field || !donationExtraction.FIELD_KEYS.includes(field)) {
        return res.status(400).json({
          message: "Champ cible requis.",
          validFields: donationExtraction.FIELD_KEYS
        });
      }
      const data = await donationExtraction.extractField(text, field, formContext);
      return res.json({ transcription: text, mode: "field", data });
    }

    return res.status(400).json({ message: 'Mode invalide. Utilisez "global" ou "field".' });
  } catch (err) {
    if (err.code === "NO_DATA_EXTRACTED") {
      return res.status(err.status || 422).json({ message: err.message, code: err.code });
    }
    if (err.status) return res.status(err.status).json({ message: err.message });
    console.error("[voice/extract-donation]", err);
    return res.status(500).json({ message: "Erreur lors de l'extraction vocale." });
  }
});

module.exports = router;
