// *********************************************************************************
// shoppingcart-api-routes.js - routes for shopping cart operations
// *********************************************************************************

var db = require("../models");
var isAuthenticated = require("../config/middleware/isAuthenticated");

function isCurrentUser(req, idValue) {
  var requestedId = parseInt(idValue, 10);
  return Number.isInteger(requestedId) && req.user && req.user.id === requestedId;
}

module.exports = function(app) {
  app.get("/api/shoppingcarts", isAuthenticated, function(req, res) {
    return db.Shoppingcart.findAll({
      where: {
        UserId: req.user.id
      },
      include: [db.Book]
    })
      .then(function(dbShoppingcart) {
        res.json(dbShoppingcart);
      })
      .catch(function() {
        res.status(500).json({ message: "Unable to fetch shopping carts." });
      });
  });

  app.get("/api/shoppingcart/:UserId", isAuthenticated, function(req, res) {
    if (!isCurrentUser(req, req.params.UserId)) {
      return res.status(403).json({ message: "Forbidden." });
    }

    return db.Shoppingcart.findOne({
      where: {
        UserId: req.user.id
      }
    })
      .then(function(dbShoppingcart) {
        res.json(dbShoppingcart);
      })
      .catch(function() {
        res.status(500).json({ message: "Unable to fetch shopping cart." });
      });
  });

  app.post("/api/shoppingcarts", isAuthenticated, function(req, res) {
    var bookId = parseInt(req.body.BookId, 10);
    if (!Number.isInteger(bookId)) {
      return res.status(400).json({ message: "A valid BookId is required." });
    }

    return db.Shoppingcart.create({
      UserId: req.user.id
    })
      .then(function(dbShoppingcart) {
        return db.Shoppingcart_Book.create({
          ShoppingcartId: dbShoppingcart.id,
          BookId: bookId
        });
      })
      .then(function(dbShoppingcartBook) {
        res.json(dbShoppingcartBook);
      })
      .catch(function() {
        res.status(500).json({ message: "Unable to add book to shopping cart." });
      });
  });

  app.delete("/api/shoppingcarts/:UserId", isAuthenticated, function(req, res) {
    if (!isCurrentUser(req, req.params.UserId)) {
      return res.status(403).json({ message: "Forbidden." });
    }

    return db.Shoppingcart.destroy({
      where: {
        UserId: req.user.id
      }
    })
      .then(function(dbShoppingcart) {
        res.json(dbShoppingcart);
      })
      .catch(function() {
        res.status(500).json({ message: "Unable to delete shopping cart." });
      });
  });

  app.put("/api/shoppingcarts", isAuthenticated, function(req, res) {
    return db.Shoppingcart.update(req.body, {
      where: {
        UserId: req.user.id
      }
    })
      .then(function(dbShoppingcart) {
        res.json(dbShoppingcart);
      })
      .catch(function() {
        res.status(500).json({ message: "Unable to update shopping cart." });
      });
  });
};
