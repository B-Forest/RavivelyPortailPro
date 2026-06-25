const mongoose = require("mongoose");

const DONATION_CATEGORY = ["fruits_legumes", "produits_frais", "epicerie", "plats_prepares"];
const DONATION_UNIT = ["kg", "portion", "litre"];
const DONATION_STATUS = ["available", "reserved", "in_progress", "collected", "cancelled"];
const ALLERGEN = ["gluten", "lait", "oeufs", "arachides", "soja", "fruits_a_coque", "poisson", "crustaces"];

const donationSchema = new mongoose.Schema(
  {
    associationId: { type: mongoose.Schema.Types.ObjectId, ref: "Association", required: true },
    title: { type: String, required: [true, "La dénomination du don est obligatoire."], trim: true },
    description: { type: String, trim: true },
    category: { type: String, enum: DONATION_CATEGORY, required: true },
    quantity: {
      type: Number,
      required: [true, "Veuillez indiquer la quantité."],
      min: [0.1, "La quantité doit être supérieure à 0."]
    },
    unit: { type: String, enum: DONATION_UNIT, required: [true, "Veuillez indiquer l'unité."] },
    expirationDate: {
      type: Date,
      required: [true, "La date limite de consommation (DLC) est obligatoire."]
    },
    allergens: [{ type: String, enum: ALLERGEN }],
    pickupInstructions: { type: String, trim: true },
    status: { type: String, enum: DONATION_STATUS, default: "available" }
  },
  { timestamps: true }
);

donationSchema.index({ associationId: 1, status: 1 });

module.exports = mongoose.model("Donation", donationSchema);
module.exports.DONATION_CATEGORY = DONATION_CATEGORY;
module.exports.DONATION_UNIT = DONATION_UNIT;
module.exports.DONATION_STATUS = DONATION_STATUS;
module.exports.ALLERGEN = ALLERGEN;
