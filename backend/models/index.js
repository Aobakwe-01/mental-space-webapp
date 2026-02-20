const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Create Sequelize instance
const sequelize = new Sequelize(
    dbConfig.database,
    dbConfig.username,
    dbConfig.password,
    {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: dbConfig.dialect,
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

// Import models
const User = require('./User');
const MoodEntry = require('./MoodEntry');
const Program = require('./Program');
const ProgramModule = require('./ProgramModule');
const UserProgram = require('./UserProgram');
const ModuleCompletion = require('./ModuleCompletion');
const ChatSession = require('./ChatSession');
const ChatMessage = require('./ChatMessage');
const Counselor = require('./Counselor');
const BreathingSession = require('./BreathingSession');
const Achievement = require('./Achievement');
const UserAchievement = require('./UserAchievement');

// Initialize models
const models = {
    User: User.init(sequelize, Sequelize.DataTypes),
    MoodEntry: MoodEntry.init(sequelize, Sequelize.DataTypes),
    Program: Program.init(sequelize, Sequelize.DataTypes),
    ProgramModule: ProgramModule.init(sequelize, Sequelize.DataTypes),
    UserProgram: UserProgram.init(sequelize, Sequelize.DataTypes),
    ModuleCompletion: ModuleCompletion.init(sequelize, Sequelize.DataTypes),
    ChatSession: ChatSession.init(sequelize, Sequelize.DataTypes),
    ChatMessage: ChatMessage.init(sequelize, Sequelize.DataTypes),
    Counselor: Counselor.init(sequelize, Sequelize.DataTypes),
    BreathingSession: BreathingSession.init(sequelize, Sequelize.DataTypes),
    Achievement: Achievement.init(sequelize, Sequelize.DataTypes),
    UserAchievement: UserAchievement.init(sequelize, Sequelize.DataTypes)
};

// Define associations
Object.keys(models).forEach(modelName => {
    if (models[modelName].associate) {
        models[modelName].associate(models);
    }
});

// Export models and sequelize instance
module.exports = {
    sequelize,
    ...models
};