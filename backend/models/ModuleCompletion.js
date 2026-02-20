const { DataTypes } = require('sequelize');

module.exports = class ModuleCompletion {
    static init(sequelize, DataTypes) {
        return sequelize.define('ModuleCompletion', {
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
            moduleId: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'ProgramModules',
                    key: 'id'
                }
            },
            completedAt: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW
            },
            timeSpent: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
                comment: 'Time spent in seconds'
            },
            score: {
                type: DataTypes.FLOAT,
                allowNull: true,
                validate: {
                    min: 0,
                    max: 100
                }
            },
            attempts: {
                type: DataTypes.INTEGER,
                defaultValue: 1
            }
        });
    }

    static associate(models) {
        this.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
        this.belongsTo(models.ProgramModule, { foreignKey: 'moduleId', as: 'module' });
    }
};