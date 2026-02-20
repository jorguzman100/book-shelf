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
  if (activeConfig.use_env_variable) {
    if (!process.env[activeConfig.use_env_variable]) {
      throw new Error(
        `Missing ${activeConfig.use_env_variable} for NODE_ENV=${environment}.`
      );
    }

    return;
  }

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

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

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
