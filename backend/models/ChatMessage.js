const { DataTypes } = require('sequelize');

module.exports = class ChatMessage {
    static init(sequelize, DataTypes) {
        return sequelize.define('ChatMessage', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            sessionId: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'ChatSessions',
                    key: 'id'
                }
            },
            senderId: {
                type: DataTypes.UUID,
                allowNull: false
            },
            senderType: {
                type: DataTypes.STRING,
                allowNull: false,
                validate: {
                    isIn: [['user', 'counselor']]
                }
            },
            message: {
                type: DataTypes.TEXT,
                allowNull: false
            },
            messageType: {
                type: DataTypes.STRING,
                defaultValue: 'text',
                validate: {
                    isIn: [['text', 'image', 'file', 'resource', 'system']]
                }
            },
            attachmentUrl: {
                type: DataTypes.STRING,
                allowNull: true
            },
            isRead: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            sentAt: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW
            },
            editedAt: {
                type: DataTypes.DATE,
                allowNull: true
            },
            isEdited: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            }
        });
    }

    static associate(models) {
        this.belongsTo(models.ChatSession, { foreignKey: 'sessionId', as: 'session' });
        this.belongsTo(models.User, { foreignKey: 'senderId', as: 'sender', constraints: false });
        this.belongsTo(models.Counselor, { foreignKey: 'senderId', as: 'counselor', constraints: false });
    }
};