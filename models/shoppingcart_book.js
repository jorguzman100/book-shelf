module.exports = function (sequelize, DataTypes) {
    const Shoppingcart_Book = sequelize.define('Shoppingcart_Book', {
        ShoppingcartId: {
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

    return Shoppingcart_Book;
}
