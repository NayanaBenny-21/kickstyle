const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/userSchema");
const generateReferralCode = require("../helpers/generateReferralCode");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL, // ✅ ENV-based
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
<<<<<<< HEAD
        const email = profile.emails[0].value;
        let user = await User.findOne({ email });
        // Create user if not exists
        if (!user) {
          const referralCode = generateReferralCode(profile.displayName);

          user = await User.create({
            name: profile.displayName,
            email: email,
            googleId: profile.id,
            referralCode: referralCode,
            isVerified: true
          });
        }

        // Attach googleId if user registered with email/password earlier
        if (user && !user.googleId) {
=======
        // Google always provides verified email
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(null, false, { message: "Google account has no email" });
        }

        // Find existing user
        let user = await User.findOne({ email });
        if (!user) {
          return done(null, false, {
            message: "No account found with this email",
          });
        }

        // Link Google account if not already linked
        if (!user.googleId) {
>>>>>>> main
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
