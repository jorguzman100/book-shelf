'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
require('../config/load-env');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config')[env];
const db = {};

function validateConfig(activeConfig, environment) {
  const requiredKeys = ['database', 'username', 'password'];
  const missingKeys = requiredKeys.filter(
    key => activeConfig[key] === undefined || activeConfig[key] === null
  );

  if (missingKeys.length > 0) {
    throw new Error(
      `Missing database config values (${missingKeys.join(
        ', '
      )}) for NODE_ENV=${environment}.`
    );
  }
}

validateConfig(config, env);

const sequelize = new Sequelize(config.database, config.username, config.password, config);

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
