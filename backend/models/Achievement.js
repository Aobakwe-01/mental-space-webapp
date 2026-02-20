const { DataTypes } = require('sequelize');

module.exports = class Achievement {
    static init(sequelize, DataTypes) {
        return sequelize.define('Achievement', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: false
            },
            icon: {
                type: DataTypes.STRING,
                allowNull: true
            },
            category: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    isIn: [['mood', 'program', 'streak', 'social', 'special']]
                }
            },
            requirement: {
                type: DataTypes.JSON,
                allowNull: false
            },
            points: {
                type: DataTypes.INTEGER,
                defaultValue: 0
            },
            isActive: {
                type: DataTypes.BOOLEAN,
                defaultValue: true
            },
            rarity: {
                type: DataTypes.STRING,
                defaultValue: 'common',
                validate: {
                    isIn: [['common', 'rare', 'epic', 'legendary']]
                }
            }
        });
    }

    static associate(models) {
        this.hasMany(models.UserAchievement, { foreignKey: 'achievementId', as: 'userAchievements' });
    }
};