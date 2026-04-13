const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error("MONGODB_URI no esta definido en variables de entorno.");
    }

    await mongoose.connect(mongoUri);
    console.log("MongoDB conectado correctamente.");
  } catch (error) {
    console.error("Error al conectar con MongoDB:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
