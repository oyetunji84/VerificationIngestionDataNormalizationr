const mongoose = require('mongoose');

const connectDatabase = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`Integration Service MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
    console.log('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination');
      process.exit(0);
    });

  } catch (error) {
    console.log('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDatabase;
