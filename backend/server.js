require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");

const authRoutes = require("./routes/auth");
const donationRoutes = require("./routes/donations");

const app = express();

connectDB();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (req, res) => res.json({ status: "ok", service: "ravively-pro-api" }));

app.use("/api/auth", authRoutes);
app.use("/api/donations", donationRoutes);

// 404
app.use((req, res) => res.status(404).json({ message: "Route non trouvée." }));

// Gestion centralisée des erreurs
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ message: err.message || "Erreur serveur." });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`[API] Ravively Pro lancée sur http://localhost:${PORT}`));
