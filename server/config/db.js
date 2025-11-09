// server/config/Db.js
/**
 * @purpose Establishes and manages the connection to the MongoDB database using Mongoose.
 * It attempts to connect to the database and logs the connection status,
 * exiting the process with an error if the connection fails.
 */

import mongoose from 'mongoose';
// mongoose library is an Object Data Modeling library for MongoDB and Node.js
// use functionality inside moogoose library to interact with mongoDB database;
// from 'mongoose' indicated that mongoose package must be installed in the project;

const connectDB = async () => {
  try {
    // mongoose.connect is a method to establish a connection to mongoDB database;
    const conn = await mongoose.connect(process.env.MONGO_URI);
    // conn.connection is the Mongoose connection object. It contains the detail of this connection;
    // .host means the hostname of mongoDB server. such as localhost or cloud server address;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    // Terminate the Node.js process
    // 1 is an exit code indicate end due to error;
    process.exit(1);
  }
};

export default connectDB;

