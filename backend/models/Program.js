const { DataTypes } = require('sequelize');

module.exports = class Program {
    static init(sequelize, DataTypes) {
        return sequelize.define('Program', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            title: {
                type: DataTypes.STRING,
                allowNull: false
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: false
            },
            category: {
                type: DataTypes.STRING,
                allowNull: false
            },
            duration: {
                type: DataTypes.INTEGER,
                allowNull: false,
                comment: 'Duration in days'
            },
            difficulty: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    isIn: [['beginner', 'intermediate', 'advanced']]
                }
            },
            isActive: {
                type: DataTypes.BOOLEAN,
                defaultValue: true
            },
            icon: {
                type: DataTypes.STRING,
                allowNull: true
            },
            color: {
                type: DataTypes.STRING,
                defaultValue: '#8FBC8F'
            },
            estimatedHours: {
                type: DataTypes.INTEGER,
                allowNull: false,
                comment: 'Estimated total hours to complete'
            },
            objectives: {
                type: DataTypes.ARRAY(DataTypes.STRING),
                defaultValue: []
            },
            prerequisites: {
                type: DataTypes.ARRAY(DataTypes.STRING),
                defaultValue: []
            }
        });
    }

    static associate(models) {
        this.hasMany(models.ProgramModule, { foreignKey: 'programId', as: 'modules' });
        this.hasMany(models.UserProgram, { foreignKey: 'programId', as: 'userPrograms' });
    }
};