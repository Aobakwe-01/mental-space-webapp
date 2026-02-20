const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = class User {
    static init(sequelize, DataTypes) {
        const User = sequelize.define('User', {
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
            dateOfBirth: {
                type: DataTypes.DATE,
                allowNull: true
            },
            gender: {
                type: DataTypes.STRING,
                allowNull: true
            },
            avatar: {
                type: DataTypes.STRING,
                allowNull: true
            },
            isPremium: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            isAnonymous: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            timezone: {
                type: DataTypes.STRING,
                defaultValue: 'UTC'
            },
            language: {
                type: DataTypes.STRING,
                defaultValue: 'en'
            },
            theme: {
                type: DataTypes.STRING,
                defaultValue: 'light'
            },
            fontSize: {
                type: DataTypes.STRING,
                defaultValue: 'medium'
            },
            isEmailVerified: {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            },
            emailVerificationToken: {
                type: DataTypes.STRING,
                allowNull: true
            },
            passwordResetToken: {
                type: DataTypes.STRING,
                allowNull: true
            },
            passwordResetExpires: {
                type: DataTypes.DATE,
                allowNull: true
            },
            lastLoginAt: {
                type: DataTypes.DATE,
                allowNull: true
            },
            isActive: {
                type: DataTypes.BOOLEAN,
                defaultValue: true
            }
        }, {
            hooks: {
                beforeCreate: async (user) => {
                    if (user.password) {
                        user.password = await bcrypt.hash(user.password, 12);
                    }
                },
                beforeUpdate: async (user) => {
                    if (user.changed('password')) {
                        user.password = await bcrypt.hash(user.password, 12);
                    }
                }
            }
        });

        User.prototype.comparePassword = async function(candidatePassword) {
            return bcrypt.compare(candidatePassword, this.password);
        };

        User.prototype.toJSON = function() {
            const values = Object.assign({}, this.get());
            delete values.password;
            delete values.emailVerificationToken;
            delete values.passwordResetToken;
            delete values.passwordResetExpires;
            return values;
        };

        return User;
    }

    static associate(models) {
        this.hasMany(models.MoodEntry, { foreignKey: 'userId', as: 'moodEntries' });
        this.hasMany(models.UserProgram, { foreignKey: 'userId', as: 'userPrograms' });
        this.hasMany(models.ModuleCompletion, { foreignKey: 'userId', as: 'moduleCompletions' });
        this.hasMany(models.ChatSession, { foreignKey: 'userId', as: 'chatSessions' });
        this.hasMany(models.ChatMessage, { foreignKey: 'senderId', as: 'sentMessages' });
        this.hasMany(models.BreathingSession, { foreignKey: 'userId', as: 'breathingSessions' });
        this.hasMany(models.UserAchievement, { foreignKey: 'userId', as: 'userAchievements' });
    }
};