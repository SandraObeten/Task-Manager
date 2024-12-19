const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/sequelize");
const Task = require("./task");

const Comment = sequelize.define("comment", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  comment: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  createdFor: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Task,
      key: "id",
    },
  },
});

module.exports = Comment;


