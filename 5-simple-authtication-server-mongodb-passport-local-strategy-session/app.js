const dotenv = require("dotenv").config();
const express = require("express");
const cors = require("cors");
const ejs = require("ejs");
const User = require("./models/user.model");
const app = express();
require("./config/database");
require("./config/passport");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const passport = require("passport");
const session = require("express-session");
const MongoStore = require("connect-mongo");

app.set("view engine", "ejs");
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("trust proxy", 1); // trust first proxy
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
      mongoUrl: process.env.DATABASE,
      collectionName: "sessions", // See below for details
    }),
    // cookie: { secure: true },
  })
);

app.use(passport.initialize());
app.use(passport.session());

//base url
app.get("/", (req, res) => {
  res.render("index");
});

//register : get
app.get("/register", (req, res) => {
  res.render("register");
});

//register : post
app.post("/register", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.body.username });
    if (user) return res.status(400).send("user alread exits");
    bcrypt.hash(req.body.password, saltRounds, async (err, hash) => {
      const newUser = new User({
        username: req.body.username,
        password: hash,
      });
      await newUser.save();
      res.status(201).redirect("/login");
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

//login : get
app.get("/login", (req, res) => {
  res.render("login");
});

//login : post
app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    successRedirect: "/profile",
  })
);

//profile
app.get("/profile", (req, res) => {
  res.render("profile");
});

//logout
app.get("/logout", (req, res) => {
  res.redirect("/");
});

module.exports = app;