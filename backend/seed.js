// Script de démonstration : crée une association + un compte + 3 dons d'exemple
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Association = require("./models/Association");
const User = require("./models/User");
const Donation = require("./models/Donation");

async function seed() {
  await connectDB();

  await Promise.all([Association.deleteMany({}), User.deleteMany({}), Donation.deleteMany({})]);

  const association = await Association.create({
    name: "Banque Alimentaire de Tours",
    email: "contact@banquealimentaire-tours.fr",
    phone: "0247000000",
    address: "12 rue de la Solidarité",
    city: "Tours",
    postalCode: "37000",
    siret: "12345678900012"
  });

  const user = await User.create({
    firstname: "Marie",
    lastname: "Dupont",
    email: "marie@banquealimentaire-tours.fr",
    password: "password123",
    role: "association",
    associationId: association._id
  });

  await Donation.insertMany([
    {
      associationId: association._id,
      title: "Cagettes de tomates",
      category: "fruits_legumes",
      quantity: 30,
      unit: "kg",
      expirationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      allergens: [],
      pickupInstructions: "Quai de livraison, porte B",
      status: "available"
    },
    {
      associationId: association._id,
      title: "Repas complets surgelés",
      category: "plats_prepares",
      quantity: 15,
      unit: "portion",
      expirationDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      allergens: ["gluten", "lait"],
      pickupInstructions: "Chambre froide, accueil",
      status: "reserved"
    },
    {
      associationId: association._id,
      title: "Yaourts nature",
      category: "produits_frais",
      quantity: 50,
      unit: "kg",
      expirationDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      allergens: ["lait"],
      status: "collected"
    }
  ]);

  console.log("Seed terminé.");
  console.log("Compte de test : marie@banquealimentaire-tours.fr / password123");
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
