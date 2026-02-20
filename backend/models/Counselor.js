const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = class Counselor {
    static init(sequelize, DataTypes) {
        const Counselor = sequelize.define('Counselor', {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },
            email: {
                type: DataTypes.STRING,
                unique: true,
                allowNull: false,
                validate: {
                    isEmail: true
                }
            },
            password: {
                type: DataTypes.STRING,
                allowNull: false
            },
            firstName: {
                type: DataTypes.STRING,
                allowNull: false
            },
            lastName: {
                type: DataTypes.STRING,
                allowNull: false
            },
            licenseNumber: {
                type: DataTypes.STRING,
                unique: true,
                allowNull: false
            },
            specializations: {
                type: DataTypes.ARRAY(DataTypes.STRING),
                defaultValue: []
            },
            bio: {
                type: DataTypes.TEXT,
                allowNull: true
            },
            avatar: {
                type: DataTypes.STRING,
                allowNull: true
            },
            isOnline: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            status: {
                type: DataTypes.STRING,
                defaultValue: 'offline',
                validate: {
                    isIn: [['available', 'busy', 'offline']]
                }
            },
            rating: {
                type: DataTypes.FLOAT,
                defaultValue: 0,
                validate: {
                    min: 0,
                    max: 5
                }
            },
            totalSessions: {
                type: DataTypes.INTEGER,
                defaultValue: 0
            },
            totalHours: {
                type: DataTypes.INTEGER,
                defaultValue: 0,
                comment: 'Total hours spent in sessions'
            },
            languages: {
                type: DataTypes.ARRAY(DataTypes.STRING),
                defaultValue: ['en']
            },
            timezone: {
                type: DataTypes.STRING,
                defaultValue: 'UTC'
            },
            isActive: {
                type: DataTypes.BOOLEAN,
                defaultValue: true
            }
        }, {
            hooks: {
                beforeCreate: async (counselor) => {
                    if (counselor.password) {
                        counselor.password = await bcrypt.hash(counselor.password, 12);
                    }
                },
                beforeUpdate: async (counselor) => {
                    if (counselor.changed('password')) {
                        counselor.password = await bcrypt.hash(counselor.password, 12);
                    }
                }
            }
        });

        Counselor.prototype.comparePassword = async function(candidatePassword) {
            return bcrypt.compare(candidatePassword, this.password);
        };

        Counselor.prototype.toJSON = function() {
            const values = Object.assign({}, this.get());
            delete values.password;
            return values;
        };

        return Counselor;
    }

    static associate(models) {
        this.hasMany(models.ChatSession, { foreignKey: 'counselorId', as: 'chatSessions' });
        this.hasMany(models.ChatMessage, { foreignKey: 'senderId', as: 'sentMessages', constraints: false });
    }
};