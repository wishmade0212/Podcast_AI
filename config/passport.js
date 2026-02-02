const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Validate Google OAuth credentials
const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const callbackURL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback';

console.log('Configuring Google OAuth...');
console.log('Client ID:', clientID ? `${clientID.substring(0, 20)}...` : 'NOT SET');
console.log('Client Secret:', clientSecret ? 'SET' : 'NOT SET');

if (!clientID || !clientSecret) {
  console.error('❌ Google OAuth credentials missing! Google login will not work.');
  console.error('Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env file');
  
  // Register a dummy strategy to prevent "Unknown strategy" error
  passport.use('google', new GoogleStrategy(
    {
      clientID: 'dummy',
      clientSecret: 'dummy',
      callbackURL: callbackURL
    },
    (accessToken, refreshToken, profile, done) => {
      done(new Error('Google OAuth not configured'), null);
    }
  ));
} else {
  // Register the actual Google OAuth Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: clientID,
        clientSecret: clientSecret,
        callbackURL: callbackURL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists in database
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            // User exists, update last login
            user.lastLogin = Date.now();
            await user.save();
            return done(null, user);
          }

          // Check if user exists with same email
          user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            // Link Google account to existing user
            user.googleId = profile.id;
            user.isEmailVerified = profile.emails[0].verified;
            user.lastLogin = Date.now();
            await user.save();
            return done(null, user);
          }

          // Create new user
          user = await User.create({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            password: Math.random().toString(36).slice(-8) + 'Aa1!', // Random password for Google users
            isEmailVerified: profile.emails[0].verified,
            lastLogin: Date.now(),
          });

          done(null, user);
        } catch (error) {
          console.error('Error in Google Strategy:', error);
          done(error, null);
        }
      }
    )
  );
  console.log('✅ Google OAuth strategy configured successfully');
}

module.exports = passport;
