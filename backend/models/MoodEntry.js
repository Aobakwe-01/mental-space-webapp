const { DataTypes } = require('sequelize');

module.exports = class MoodEntry {
    static init(sequelize, DataTypes) {
        return sequelize.define('MoodEntry', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            userId: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                }
            },
            mood: {
                type: DataTypes.INTEGER,
                allowNull: false,
                validate: {
                    min: 1,
                    max: 5
                }
            },
            note: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            date: {
                type: DataTypes.DATEONLY,
                allowNull: false
            },
            timestamp: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW
            },
            location: {
                type: DataTypes.STRING,
                allowNull: true
            },
            weather: {
                type: DataTypes.STRING,
                allowNull: true
            },
            tags: {
                type: DataTypes.ARRAY(DataTypes.STRING),
                defaultValue: []
            },
            isSignificant: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            }
        });
    }

    static associate(models) {
        this.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
};