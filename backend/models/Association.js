const mongoose = require("mongoose");

const associationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    siret: { type: String, trim: true }
  },
  { timestamps: true } // createdAt / updatedAt
);

module.exports = mongoose.model("Association", associationSchema);
