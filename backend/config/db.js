const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI manquant dans le .env");
    process.exit(1);
  }
  try {
    await mongoose.connect(uri);
    console.log("[DB] Connecté à MongoDB :", mongoose.connection.name);
  } catch (err) {
    console.error("[DB] Erreur de connexion MongoDB :", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
