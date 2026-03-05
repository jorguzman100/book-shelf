var db = require("../models");
var isAuthenticated = require("../config/middleware/isAuthenticated");

module.exports = function(app) {
  app.get("/api/books", isAuthenticated, function(req, res) {
    return db.Book.findAll({})
      .then(function(dbBook) {
        res.json(dbBook);
      })
      .catch(function() {
        res.status(500).json({ message: "Unable to fetch books." });
      });
  });

  app.get("/api/books/:id", isAuthenticated, function(req, res) {
    return db.Book.findOne({
      where: {
        id: req.params.id
      }
    })
      .then(function(dbBook) {
        res.json(dbBook);
      })
      .catch(function() {
        res.status(500).json({ message: "Unable to fetch book." });
      });
  });

  app.get("/api/books/category/:category", isAuthenticated, function(req, res) {
    var category = decodeURIComponent(req.params.category || "");
    return db.Book.findAll({
      where: {
        categories: category
      }
    })
      .then(function(dbBook) {
        res.json(dbBook);
      })
      .catch(function() {
        res.status(500).json({ message: "Unable to fetch category." });
      });
  });

  app.post("/api/books", isAuthenticated, function(req, res) {
    return db.Book.create(req.body)
      .then(function(dbBook) {
        res.json(dbBook);
      })
      .catch(function() {
        res.status(500).json({ message: "Unable to create book." });
      });
  });

  app.delete("/api/books/:id", isAuthenticated, function(req, res) {
    return db.Book.destroy({
      where: {
        id: req.params.id
      }
    })
      .then(function(dbBook) {
        res.json(dbBook);
      })
      .catch(function() {
        res.status(500).json({ message: "Unable to delete book." });
      });
  });

  app.put("/api/books", isAuthenticated, function(req, res) {
    return db.Book.update(req.body, {
      where: {
        id: req.body.id
      }
    })
      .then(function(dbBook) {
        res.json(dbBook);
      })
      .catch(function() {
        res.status(500).json({ message: "Unable to update book." });
      });
  });
};
