// *********************************************************************************
// Purchase-api-routes.js - routes for purchases
// *********************************************************************************

var db = require("../models");
var isAuthenticated = require("../config/middleware/isAuthenticated");

function isCurrentUser(req, idValue) {
  var requestedId = parseInt(idValue, 10);
  return Number.isInteger(requestedId) && req.user && req.user.id === requestedId;
}

module.exports = function(app) {
  app.get("/api/purchases", isAuthenticated, function(req, res) {
    return db.Purchase.findAll({
      where: {
        UserId: req.user.id
      },
      include: [db.Book]
    })
      .then(function(dbPurchase) {
        res.json(dbPurchase);
      })
      .catch(function() {
        res.status(500).json({ message: "Unable to fetch purchases." });
      });
  });

  app.get("/api/purchase/:UserId", isAuthenticated, function(req, res) {
    if (!isCurrentUser(req, req.params.UserId)) {
      return res.status(403).json({ message: "Forbidden." });
    }

    return db.Purchase.findAll({
      where: {
        UserId: req.user.id
      },
      include: [db.Book]
    })
      .then(function(dbPurchase) {
        res.json(dbPurchase);
      })
      .catch(function() {
        res.status(500).json({ message: "Unable to fetch purchase history." });
      });
  });

  app.post("/api/purchases", isAuthenticated, function(req, res) {
    var bookId = parseInt(req.body.BookId, 10);
    if (!Number.isInteger(bookId)) {
      return res.status(400).json({ message: "A valid BookId is required." });
    }

    return db.Purchase.create({
      UserId: req.user.id,
      date: new Date()
    })
      .then(function(dbPurchase) {
        return db.Purchase_Book.create({
          PurchaseId: dbPurchase.id,
          BookId: bookId
        });
      })
      .then(function(dbPurchaseBook) {
        res.json(dbPurchaseBook);
      })
      .catch(function() {
        res.status(500).json({ message: "Unable to create purchase." });
      });
  });

  app.delete("/api/purchases/:UserId", isAuthenticated, function(req, res) {
    if (!isCurrentUser(req, req.params.UserId)) {
      return res.status(403).json({ message: "Forbidden." });
    }

    return db.Purchase.destroy({
      where: {
        UserId: req.user.id
      }
    })
      .then(function(dbPurchase) {
        res.json(dbPurchase);
      })
      .catch(function() {
        res.status(500).json({ message: "Unable to delete purchases." });
      });
  });

  app.put("/api/purchases", isAuthenticated, function(req, res) {
    return db.Purchase.update(req.body, {
      where: {
        UserId: req.user.id
      }
    })
      .then(function(dbPurchase) {
        res.json(dbPurchase);
      })
      .catch(function() {
        res.status(500).json({ message: "Unable to update purchases." });
      });
  });
};
