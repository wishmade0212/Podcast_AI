const jwt = require('jsonwebtoken');
const { MongoClient } = require('mongodb');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const { code } = event.queryStringParameters || {};

  if (!code) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Authorization code missing' })
    };
  }

  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const CALLBACK_URL = process.env.URL + '/.netlify/functions/auth-callback';
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  const MONGODB_URI = process.env.MONGODB_URI;

  try {
    // Use native fetch (available in Node 18+)
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: CALLBACK_URL,
        grant_type: 'authorization_code'
      })
    });

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      throw new Error('Failed to get access token');
    }

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    });

    const userInfo = await userInfoResponse.json();

    // Connect to MongoDB and find/create user
    let client;
    let user;

    if (MONGODB_URI) {
      try {
        client = await MongoClient.connect(MONGODB_URI);
        const db = client.db('podcast-generator');
        const usersCollection = db.collection('users');

        // Find or create user
        user = await usersCollection.findOne({ googleId: userInfo.id });

        if (!user) {
          // Check if user exists with same email
          user = await usersCollection.findOne({ email: userInfo.email });

          if (user) {
            // Link Google account
            await usersCollection.updateOne(
              { _id: user._id },
              { 
                $set: { 
                  googleId: userInfo.id,
                  isEmailVerified: userInfo.verified_email,
                  lastLogin: new Date()
                }
              }
            );
          } else {
            // Create new user
            const newUser = {
              googleId: userInfo.id,
              name: userInfo.name,
              email: userInfo.email,
              isEmailVerified: userInfo.verified_email,
              password: Math.random().toString(36).slice(-8) + 'Aa1!',
              createdAt: new Date(),
              lastLogin: new Date()
            };
            const result = await usersCollection.insertOne(newUser);
            user = { ...newUser, _id: result.insertedId };
          }
        } else {
          // Update last login
          await usersCollection.updateOne(
            { _id: user._id },
            { $set: { lastLogin: new Date() } }
          );
        }
      } finally {
        if (client) await client.close();
      }
    } else {
      // No MongoDB - create temporary user
      user = {
        _id: userInfo.id,
        googleId: userInfo.id,
        name: userInfo.name,
        email: userInfo.email,
        isEmailVerified: userInfo.verified_email
      };
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id,
        email: user.email,
        name: user.name
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Redirect to dashboard with token
    const redirectUrl = `${process.env.URL}/dashboard.html?token=${token}`;

    return {
      statusCode: 302,
      headers: {
        ...headers,
        'Location': redirectUrl
      },
      body: ''
    };

  } catch (error) {
    console.error('OAuth callback error:', error);
    
    return {
      statusCode: 302,
      headers: {
        ...headers,
        'Location': `${process.env.URL}/login.html?error=authentication_failed`
      },
      body: ''
    };
  }
};
