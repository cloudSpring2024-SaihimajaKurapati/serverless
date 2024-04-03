const { PubSub } = require('@google-cloud/pubsub');
const { Sequelize, DataTypes } = require("sequelize");
const mailgun = require('mailgun-js');
require('dotenv').config();

// Assuming your Google Cloud Function is correctly configured with these environment variables
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'mysql',
  dialectOptions: {
    socketPath: `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`
  },
  logging: false // Toggle based on your preference
});

const EmailVerification = sequelize.define('EmailVerification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { isEmail: true }
  },
  verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  }
});

const mg = mailgun({ apiKey: 'fb7bb8764ffaf277ae72f50d5c1c7f97-f68a26c9-950fe44e', domain: 'cloudweba.me' });

// Function to send verification email
const sendVerificationEmail = async (data) => {
  const emailData = {
    from: 'webapp account creation <no-reply@cloudweba.me>',
    to: data.userName,
    subject: 'Verify your email address',
    text: `Click the following link to verify your email address: https://cloudweba.me/verify/${data.id}`,
  };

  try {
    await mg.messages().send(emailData);
    console.log('Verification email sent successfully.');
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

// Cloud Function to handle new user events
exports.handleNewUser = async (data, context) => {
  try {
    const userData = JSON.parse(Buffer.from(data.data, 'base64').toString());

    // Send verification email
    await sendVerificationEmail(userData);

    // Track email in database
    // await trackEmailsInDatabase(userData);

    console.log('Verification email sent and tracking data stored successfully.');
  } catch (error) {
    console.error('Error handling new user:', error);
    throw error;
  }
};