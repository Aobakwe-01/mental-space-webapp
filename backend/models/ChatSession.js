const { DataTypes } = require('sequelize');

module.exports = class ChatSession {
    static init(sequelize, DataTypes) {
        return sequelize.define('ChatSession', {
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
            counselorId: {
                type: DataTypes.UUID,
                allowNull: true,
                references: {
                    model: 'Counselors',
                    key: 'id'
                }
            },
            status: {
                type: DataTypes.STRING,
                defaultValue: 'waiting',
                validate: {
                    isIn: [['waiting', 'active', 'closed', 'escalated']]
                }
            },
            priority: {
                type: DataTypes.STRING,
                defaultValue: 'medium',
                validate: {
                    isIn: [['low', 'medium', 'high', 'emergency']]
                }
            },
            topic: {
                type: DataTypes.STRING,
                allowNull: true
            },
            description: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            startedAt: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW
            },
            endedAt: {
                type: DataTypes.DATE,
                allowNull: true
            },
            duration: {
                type: DataTypes.INTEGER,
                allowNull: true,
                comment: 'Duration in minutes'
            },
            rating: {
                type: DataTypes.INTEGER,
                allowNull: true,
                validate: {
                    min: 1,
                    max: 5
                }
            },
            feedback: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            isAnonymous: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            tags: {
                type: DataTypes.ARRAY(DataTypes.STRING),
                defaultValue: []
            }
        });
    }

    static associate(models) {
        this.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
        this.belongsTo(models.Counselor, { foreignKey: 'counselorId', as: 'counselor' });
        this.hasMany(models.ChatMessage, { foreignKey: 'sessionId', as: 'messages' });
    }
};