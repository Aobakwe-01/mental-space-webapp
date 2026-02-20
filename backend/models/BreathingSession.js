const { DataTypes } = require('sequelize');

module.exports = class BreathingSession {
    static init(sequelize, DataTypes) {
        return sequelize.define('BreathingSession', {
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
            duration: {
                type: DataTypes.INTEGER,
                allowNull: false,
                comment: 'Duration in seconds'
            },
            technique: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    isIn: [['box', '4-7-8', 'equal', 'triangle', 'coherent']]
                }
            },
            completedAt: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW
            },
            cycles: {
                type: DataTypes.INTEGER,
                allowNull: true,
                comment: 'Number of breathing cycles completed'
            },
            heartRate: {
                type: DataTypes.INTEGER,
                allowNull: true,
                comment: 'Heart rate after session (if measured)'
            },
            stressLevel: {
                type: DataTypes.INTEGER,
                allowNull: true,
                validate: {
                    min: 1,
                    max: 10
                },
                comment: 'Self-reported stress level (1-10)'
            },
            moodBefore: {
                type: DataTypes.INTEGER,
                allowNull: true,
                validate: {
                    min: 1,
                    max: 5
                }
            },
            moodAfter: {
                type: DataTypes.INTEGER,
                allowNull: true,
                validate: {
                    min: 1,
                    max: 5
                }
            }
        });
    }

    static associate(models) {
        this.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    }
};