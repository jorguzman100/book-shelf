module.exports = function (sequelize, DataTypes) {
    const Purchase_Book = sequelize.define('Purchase_Book', {
        PurchaseId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        },
        BookId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true
        }
    });

    return Purchase_Book;
}
