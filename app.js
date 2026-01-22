require("dotenv").config();
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("./config/passport");
const connectDB = require("./config/db");
const exphbs = require("express-handlebars");

// -------------------- MIDDLEWARES --------------------
const setAuthStatus = require("./middlewares/setAuthStatus");        // user
const adminAuthStatus = require("./middlewares/adminAuthStatus");    // admin

// -------------------- ROUTERS --------------------
const userRouter = require("./routes/user/userRouter");
const authRouter = require("./routes/user/authRouter");
const adminAuthRouter = require("./routes/admin/adminAuthRouter");
const adminRouter = require("./routes/admin/adminRouter");
const searchRouter = require("./routes/search");
const hbsHelpers = require("./helpers/hbsHelpers");
const wishlistMiddleware =  require('./middlewares/wishlistMiddleware');
// -------------------- DATABASE --------------------
connectDB();

const app = express();

// -------------------- BASIC MIDDLEWARE --------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "public/images")));

// Disable caching
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, private");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

// -------------------- HANDLEBARS --------------------
const hbs = exphbs.create({
  extname: ".hbs",
  helpers: hbsHelpers,
  defaultLayout: "main",
  layoutsDir: path.join(__dirname, "views/layouts"),
  partialsDir: path.join(__dirname, "views/partials"),
});
app.engine("hbs", hbs.engine);
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

// -------------------- USER SESSION --------------------
app.use(
  session({
    name: "user_session",
    secret: process.env.USER_SESSION_SECRET || "usersecret123",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URL }),
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 72 * 60 * 60 * 1000,
    },
  })
);

// Passport initialization for user
app.use(passport.initialize());
app.use(passport.session());

// User auth status
app.use(setAuthStatus);
app.use(wishlistMiddleware);

// -------------------- USER ROUTES --------------------
app.use("/", userRouter);
app.use("/auth", authRouter);
app.use("/search", searchRouter);

// -------------------- ADMIN SESSION --------------------
app.use(
  "/admin",
  session({
    name: "admin_session",
    secret: process.env.ADMIN_SESSION_SECRET || "adminsecret123",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URL }),
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 72 * 60 * 60 * 1000,
    },
  })
);

// -------------------- ADMIN ROUTES --------------------
// Admin login routes (no header)
app.use("/adminAuth", adminAuthRouter);

// Admin protected routes (show admin header)
app.use("/admin", adminAuthStatus, adminRouter);

// -------------------- SERVER --------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);



module.exports = app;
