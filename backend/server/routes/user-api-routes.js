var db = require("../models");
var passport = require("../config/passport");
var isAuthenticated = require("../config/middleware/isAuthenticated");

function sanitizeUser(user) {
  if (!user) {
    return {};
  }

  var rawUser = typeof user.get === "function" ? user.get({ plain: true }) : user;
  return {
    id: rawUser.id,
    email: rawUser.email,
    name: rawUser.name,
    preferences1: rawUser.preferences1,
    preferences2: rawUser.preferences2,
    preferences3: rawUser.preferences3
  };
}

function isCurrentUser(req, idValue) {
  var requestedId = parseInt(idValue, 10);
  return Number.isInteger(requestedId) && req.user && req.user.id === requestedId;
}

function createRateLimiter(options) {
  var windowMs = options.windowMs;
  var max = options.max;
  var hits = new Map();

  return function(req, res, next) {
    var now = Date.now();
    var emailPart =
      req.body && typeof req.body.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";
    var key = req.ip + "|" + req.path + "|" + emailPart;

    var recentHits = (hits.get(key) || []).filter(function(timestamp) {
      return now - timestamp < windowMs;
    });
    recentHits.push(now);
    hits.set(key, recentHits);

    if (hits.size > 5000) {
      hits.forEach(function(value, mapKey) {
        if (value.length === 0 || now - value[value.length - 1] > windowMs) {
          hits.delete(mapKey);
        }
      });
    }

    if (recentHits.length > max) {
      var retryAfterSeconds = Math.max(
        1,
        Math.ceil((windowMs - (now - recentHits[0])) / 1000)
      );
      res.set("Retry-After", String(retryAfterSeconds));
      return res.status(429).json({ message: "Too many requests. Please try again later." });
    }

    return next();
  };
}

var loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10
});

var signupRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5
});

module.exports = function(app) {
  app.post("/api/login", loginRateLimiter, passport.authenticate("local"), function(req, res) {
    res.json(sanitizeUser(req.user));
  });

  app.post("/api/signup", signupRateLimiter, function(req, res) {
    var email = req.body.email ? req.body.email.trim() : "";
    var password = req.body.password || "";

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    return db.User.create({
      email: email,
      password: password
    })
      .then(function(dbUser) {
        return req.login(dbUser, function(err) {
          if (err) {
            return res.status(500).json({ message: "Unable to sign in after signup." });
          }

          return res.json(sanitizeUser(dbUser));
        });
      })
      .catch(function() {
        res.status(400).json({ message: "Unable to create account." });
      });
  });

  app.post("/logout", function(req, res, next) {
    req.logout(function(logoutErr) {
      if (logoutErr) {
        return next(logoutErr);
      }

      if (!req.session) {
        return res.redirect("/");
      }

      return req.session.destroy(function(sessionErr) {
        if (sessionErr) {
          return next(sessionErr);
        }

        res.clearCookie("good_reader.sid");
        return res.redirect("/");
      });
    });
  });

  app.get("/api/user_data", function(req, res) {
    if (!req.user) {
      return res.json({});
    }

    return res.json(sanitizeUser(req.user));
  });

  app.get("/api/csrf-token", function(req, res) {
    res.json({ csrfToken: res.locals.csrfToken || "" });
  });

  // Returns only the currently authenticated user to avoid exposing all users.
  app.get("/api/users", isAuthenticated, function(req, res) {
    return db.User.findAll({
      where: {
        id: req.user.id
      },
      attributes: {
        exclude: ["password"]
      },
      include: [
        {
          model: db.Shoppingcart,
          include: [db.Book]
        },
        {
          model: db.Purchase,
          include: [db.Book]
        }
      ]
    })
      .then(function(dbUsers) {
        res.json(dbUsers);
      })
      .catch(function() {
        res.status(500).json({ message: "Unable to fetch users." });
      });
  });

  // Restrict lookups to the user that owns the session.
  app.get("/api/users/:id", isAuthenticated, function(req, res) {
    if (!isCurrentUser(req, req.params.id)) {
      return res.status(403).json({ message: "Forbidden." });
    }

    return db.User.findOne({
      where: {
        id: req.user.id
      },
      attributes: {
        exclude: ["password"]
      },
      include: [
        {
          model: db.Shoppingcart,
          include: [db.Shoppingcart_Book]
        },
        {
          model: db.Purchase,
          include: [db.Purchase_Book]
        }
      ]
    })
      .then(function(dbUser) {
        res.json(dbUser);
      })
      .catch(function() {
        res.status(500).json({ message: "Unable to fetch user." });
      });
  });

  // Keep account creation through /api/signup only.
  app.post("/api/users", function(req, res) {
    res.status(405).json({ message: "Use /api/signup." });
  });

  // Allow users to update only their own profile fields.
  app.put("/api/users", isAuthenticated, function(req, res) {
    var updates = {};
    var updatableFields = ["name", "preferences1", "preferences2", "preferences3"];

    updatableFields.forEach(function(field) {
      if (typeof req.body[field] === "string") {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields to update." });
    }

    return db.User.update(updates, {
      where: {
        id: req.user.id
      }
    })
      .then(function(dbUser) {
        res.json(dbUser);
      })
      .catch(function() {
        res.status(500).json({ message: "Unable to update user." });
      });
  });

  app.delete("/api/users/:id", isAuthenticated, function(req, res) {
    if (!isCurrentUser(req, req.params.id)) {
      return res.status(403).json({ message: "Forbidden." });
    }

    return db.User.destroy({
      where: {
        id: req.user.id
      }
    })
      .then(function(dbUser) {
        res.json(dbUser);
      })
      .catch(function() {
        res.status(500).json({ message: "Unable to delete user." });
      });
  });
};
