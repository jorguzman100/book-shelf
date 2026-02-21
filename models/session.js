module.exports = function(sequelize, DataTypes) {
  var Session = sequelize.define(
    "Session",
    {
      sid: {
        type: DataTypes.STRING(128),
        allowNull: false,
        primaryKey: true
      },
      data: {
        type: DataTypes.TEXT("long"),
        allowNull: false
      },
      expires: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      timestamps: false,
      indexes: [
        {
          fields: ["expires"]
        }
      ]
    }
  );

  return Session;
};
