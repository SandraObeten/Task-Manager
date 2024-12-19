const sequelize = require("../config/sequelize");
const {Sequelize, DataTypes} = require("sequelize");

const Task = sequelize.define("Task", {
    id : {
        primaryKey : true,
        type : DataTypes.INTEGER,
        autoIncrement : true
    },
    title : {
        type : DataTypes.STRING,
        allowNull : false
    },
    description : {
        type : DataTypes.TEXT,
    },
    dueDate : {
        type : DataTypes.DATE,
        allowNull : false,
    },
    status : {
        type : DataTypes.ENUM("To-Do", " In Progress", "Completed"),
        allowNull : false, 
    },
    tag: {
        type: DataTypes.STRING,
    },
    comment: {
        type: DataTypes.TEXT
    },

});


module.exports = Task;