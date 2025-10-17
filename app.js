const express = require('express');
const path = require("path");
const session = require('express-session');
const MongoStore = require('connect-mongo');
const exphbs = require('express-handlebars'); // <-- changed from hbs
const cookieParser = require('cookie-parser');
const connectDB = require("./config/db");
const passport = require("./config/passport");
require("dotenv").config();

const setAuthStatus = require('./middlewares/setAuthStatus');
const userRouter = require('./routes/user/userRouter');
const authRouter = require('./routes/user/authRouter');
const adminAuthRouter = require('./routes/admin/adminAuthRouter');
const adminRouter = require('./routes/admin/adminRouter');
const hbsHelpers = require('./helpers/hbsHelpers'); // import your helpers
const searchRouter = require('./routes/search');
connectDB();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.SESSION_SECRET));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URL }),
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 72 * 60 * 60 * 1000
  }
}));

app.use(passport.initialize());
app.use(passport.session());
// -------------------- Handlebars setup --------------------
const hbs = exphbs.create({
  extname: '.hbs',
  helpers: hbsHelpers,           // <-- pass helpers
  defaultLayout: 'main',          // layouts/main.hbs
  layoutsDir: path.join(__dirname, 'views', 'layouts'),
  partialsDir: path.join(__dirname, 'views', 'partials')
});

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// -----------------------------------------------------------

app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(setAuthStatus);

app.use((req, res, next) => {
  console.log('Incoming req.body:', req.body);
  next();
});


app.use('/', userRouter);
app.use('/auth', authRouter);
app.use('/adminAuth', adminAuthRouter);
app.use('/admin', adminRouter);
app.use('/search', searchRouter);


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
