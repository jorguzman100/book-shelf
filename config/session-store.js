var session = require("express-session");

function parseSessionData(serialized) {
  if (typeof serialized !== "string" || !serialized) {
    return {};
  }

  try {
    return JSON.parse(serialized);
  } catch (_err) {
    return {};
  }
}

function createExpiresAtFromSession(sessionData) {
  var cookieExpires =
    sessionData && sessionData.cookie ? sessionData.cookie.expires : null;

  if (cookieExpires instanceof Date && !Number.isNaN(cookieExpires.getTime())) {
    return cookieExpires;
  }

  if (
    typeof cookieExpires === "string"
  ) {
    var expiresAt = new Date(cookieExpires);
    if (!Number.isNaN(expiresAt.getTime())) {
      return expiresAt;
    }
  }

  if (
    sessionData &&
    sessionData.cookie &&
    typeof sessionData.cookie.maxAge === "number"
  ) {
    return new Date(Date.now() + sessionData.cookie.maxAge);
  }

  // Fallback for non-persistent cookies.
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
}

class SequelizeSessionStore extends session.Store {
  constructor(SessionModel, options) {
    super();
    this.SessionModel = SessionModel;
    this.cleanupIntervalMs = (options && options.cleanupIntervalMs) || 60 * 60 * 1000;

    var self = this;
    this.cleanupTimer = setInterval(function() {
      self.cleanupExpiredSessions();
    }, this.cleanupIntervalMs);

    if (typeof this.cleanupTimer.unref === "function") {
      this.cleanupTimer.unref();
    }
  }

  get(sid, callback) {
    this.SessionModel.findByPk(sid)
      .then((record) => {
        if (!record) {
          return callback(null, null);
        }

        if (record.expires && record.expires.getTime() <= Date.now()) {
          return this.destroy(sid, function() {
            callback(null, null);
          });
        }

        return callback(null, parseSessionData(record.data));
      })
      .catch((err) => callback(err));
  }

  set(sid, sessionData, callback) {
    var payload = {
      sid: sid,
      data: JSON.stringify(sessionData || {}),
      expires: createExpiresAtFromSession(sessionData || {})
    };

    this.SessionModel.upsert(payload)
      .then(() => callback && callback(null))
      .catch((err) => callback && callback(err));
  }

  destroy(sid, callback) {
    this.SessionModel.destroy({
      where: {
        sid: sid
      }
    })
      .then(() => callback && callback(null))
      .catch((err) => callback && callback(err));
  }

  touch(sid, sessionData, callback) {
    this.SessionModel.update(
      {
        expires: createExpiresAtFromSession(sessionData || {}),
        data: JSON.stringify(sessionData || {})
      },
      {
        where: {
          sid: sid
        }
      }
    )
      .then(() => callback && callback(null))
      .catch((err) => callback && callback(err));
  }

  cleanupExpiredSessions() {
    var Op = this.SessionModel.sequelize.Sequelize.Op;
    return this.SessionModel.destroy({
      where: {
        expires: {
          [Op.lt]: new Date()
        }
      }
    }).catch(function() {
      // Best-effort background cleanup.
      return null;
    });
  }
}

module.exports = SequelizeSessionStore;
