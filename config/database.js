const mongoose = require('mongoose');

const isProduction = process.env.NODE_ENV === 'production';

const connectDB = async () => {
  if (isProduction) {
    console.log('Ejecutando en producción sin conexión a MongoDB');
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');

    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to db');
    });

    mongoose.connection.on('error', (err) => {
      console.log('Mongoose connection error: ' + err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose connection is disconnected');
    });

  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;