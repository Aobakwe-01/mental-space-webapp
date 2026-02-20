const { DataTypes } = require('sequelize');

module.exports = class UserAchievement {
    static init(sequelize, DataTypes) {
        return sequelize.define('UserAchievement', {
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
            achievementId: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'Achievements',
                    key: 'id'
                }
            },
            earnedAt: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW
            },
            progress: {
                type: DataTypes.FLOAT,
                defaultValue: 0,
                validate: {
                    min: 0,
                    max: 100
                }
            }
        });
    }

    static associate(models) {
        this.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
        this.belongsTo(models.Achievement, { foreignKey: 'achievementId', as: 'achievement' });
    }
};