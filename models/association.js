const{ Sequelize, DataTypes} = require('sequelize');
const User = require("./user.js");
const Task = require("./task.js");
// const { FOREIGNKEYS } = require("sequelize/lib/query-types");
const sequelize = require("../config/sequelize.js");

User.hasMany(Task, {foreignKey: 'userId', onUpdate: 'CASCADE', onDelete: 'CASCADE'});
Task.belongsTo(User, {foreignKey: 'userId'});

module.exports = {
    User,
    Task
};