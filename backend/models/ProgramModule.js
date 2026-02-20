const { DataTypes } = require('sequelize');

module.exports = class ProgramModule {
    static init(sequelize, DataTypes) {
        return sequelize.define('ProgramModule', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            programId: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'Programs',
                    key: 'id'
                }
            },
            title: {
                type: DataTypes.STRING,
                allowNull: false
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: false
            },
            content: {
                type: DataTypes.JSON,
                allowNull: true
            },
            duration: {
                type: DataTypes.INTEGER,
                allowNull: false,
                comment: 'Duration in minutes'
            },
            orderIndex: {
                type: DataTypes.INTEGER,
                allowNull: false
            },
            type: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    isIn: [['video', 'audio', 'text', 'interactive', 'quiz']]
                }
            },
            isRequired: {
                type: DataTypes.BOOLEAN,
                defaultValue: true
            },
            isLocked: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            prerequisites: {
                type: DataTypes.ARRAY(DataTypes.UUID),
                defaultValue: []
            }
        });
    }

    static associate(models) {
        this.belongsTo(models.Program, { foreignKey: 'programId', as: 'program' });
        this.hasMany(models.ModuleCompletion, { foreignKey: 'moduleId', as: 'completions' });
    }
};