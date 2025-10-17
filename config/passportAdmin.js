const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const Admin = require("../models/adminSchema");

passport.use(
  "google-admin",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_ADMIN_CLIENT_ID,
      clientSecret: process.env.GOOGLE_ADMIN_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/adminAuth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const admin = await Admin.findOne({ email });
        if (!admin) return done(null, false, { message: "Not authorized as admin" });
        return done(null, admin);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

passport.serializeUser((admin, done) => done(null, admin.id));
passport.deserializeUser(async (id, done) => {
  try {
    const admin = await Admin.findById(id).lean();
    done(null, admin);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
