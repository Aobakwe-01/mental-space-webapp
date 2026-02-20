const { DataTypes } = require('sequelize');

module.exports = class UserProgram {
    static init(sequelize, DataTypes) {
        return sequelize.define('UserProgram', {
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
            programId: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'Programs',
                    key: 'id'
                }
            },
            status: {
                type: DataTypes.STRING,
                defaultValue: 'not_started',
                validate: {
                    isIn: [['not_started', 'in_progress', 'completed', 'paused']]
                }
            },
            progress: {
                type: DataTypes.FLOAT,
                defaultValue: 0,
                validate: {
                    min: 0,
                    max: 100
                }
            },
            startedAt: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW
            },
            completedAt: {
                type: DataTypes.DATE,
                allowNull: true
            },
            lastAccessedAt: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW
            },
            timeSpent: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
                comment: 'Time spent in minutes'
            },
            bookmarks: {
                type: DataTypes.ARRAY(DataTypes.UUID),
                defaultValue: []
            }
        });
    }

    static associate(models) {
        this.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
        this.belongsTo(models.Program, { foreignKey: 'programId', as: 'program' });
    }
};