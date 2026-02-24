var isAuthenticated = require("../config/middleware/isAuthenticated");

module.exports = function(app) {
  app.get("/", function(req, res) {
    if (req.user) {
      res.redirect("/home");
    } else {
      res.render('signup', {js: ['signup.js']});
    }
  });

  app.get("/login", function(req, res) {
    if (req.user) {
      res.redirect("/home");
    } else {
      res.render('login', {js: ['login.js']});
    }
  });

  app.get("/home", isAuthenticated, function(req, res) {
    res.render('home', {js: ['home.js']});
  });

  app.get("/browse", isAuthenticated, function(req, res) {
    res.render('browse', {js: ['books.js']});
  });

  app.get("/cart", isAuthenticated, function(req, res) {
    res.render('cart', {js: ['shoppingcarts.js']});
  });
};
