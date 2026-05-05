const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/userSchema");
const generateReferralCode = require("../helpers/generateReferralCode");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Get email safely
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(null, false, {
            message: "Google account has no email",
          });
        }

        // Find user
        let user = await User.findOne({ email });

        // ✅ If user does not exist → create
        if (!user) {
          const referralCode = generateReferralCode(profile.displayName);

          user = await User.create({
            name: profile.displayName,
            email: email,
            googleId: profile.id,
            referralCode: referralCode,
            isVerified: true,
          });
        }

        // ✅ If user exists but no Google linked → link it
        if (user && !user.googleId) {
          user.googleId = profile.id;
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// Serialize user id into session
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

module.exports = passport;