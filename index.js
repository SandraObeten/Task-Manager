const dotenv = require("dotenv");
dotenv.config();
const sequelize = require("./config/sequelize");
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const comment = require("./models/comment.js")




const app = express();
app.use(express.json());
const{ User, Task} = require("./models/association.js");
// const { Console } = require("console");
// const { where } = require("sequelize");


// USER SECTION
// To register a new user

app.post("/register", async(req, res) => {    
    try {
        // Accept input from the body
        const {name, email, password} = req.body;

        // Check if all fields are filled
        if(!name || !email || !password){
            return res.status(400).json({Message : "Please input all fields correctly!"});
        }

        const userExists = await User.findOne({where : {email}});
        if(userExists){
            return res.status(201).json({Message : "User already exists"});
        }

        if(password.length < 8) {
            return res.status(404).json({ messsage: 'Password is too short'});
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            name,
            email,
            password: hashedPassword,
            role: 'user'
        };

        await User.create(newUser);
        return res.json({Message : "User created successfully!"});
        
    } catch (error) {
        console.log(error);
    }
});

//login implementation with jwt authentication

app.post("/login", async(req, res) => {
    try {
        const {email, password} = req.body;
        const ifuserExists =await User.findOne({where: {email}});

        if (!ifuserExists) {
            return res.status(404).json({message: "Account doesn't Exist"});
        }

        const checkPassword = await bcrypt.compare(password, ifuserExists.password);

        if (!checkPassword) {
            return res.status(403).json({message: "Incorrect Credentials"});
        }

        const accessToken = jwt.sign(
            {
                id: ifuserExists.id,
                name: ifuserExists.name,
                email: ifuserExists.email
            },
            process.env.JWT_SECRET
        );
        console.log(accessToken);

        return res.status(200).json({message: "Login Successfully"});
    }catch (error) {
        return res.status(500).json({message:""})
    }
});

// Only Admins can create other Admins

app.post('/create-admin/:userId', async (req, res) => {
    const { userId } = req.params;
    const { name, email, password } = req.body;
    
    try{
        const user = await User.findOne( { where: { id: userId}});

        if(!user) {
            return res.status(404).json({ messsage: "User does not exist"});
        }

        if(user.role !== "admin") {
            return res.status(403).json({ message: "Unauthorised Request"});
        }

        const existingUser = await User.findOne({ where: { email}});
        if(existingUser) {
            return res.status(400).json({ message: "Email address already exists"});
        };
        
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            name,
            email,
            password: hashedPassword,
            role: 'admin'
        };

        await User.create(newUser);

        return res.status(201).json({ message: "User created successfully"});
    } catch (error) {
        res.status(500).json({ message: `Internal server Error: ${error.message}`})
        console.log(error);
    }
    
})

app.delete("/user/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const ifExist = await User.findOne({where: {id}});

        if (ifExist) {
            await User.destroy({where: {id}});
            return res.status(200).json({message: "User deleted Succesfully"})
        } else {
            return res.status(404).json({message: "User with this ID does not exist"});
        }
    } catch (error) {
        return res.status(500).json({message: "Internal server error" + error.message});
    }
});

//TASK SECTION
// User can assign tasks to themselves or others

app.post("/add-task/:userId", async (req, res) => {
    try {
        const {userId} = req.params;
        const {title, description, status, dueDate, tag, comment} = req.body;
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({message: `User with ID: ${userId} does not exist`})
        }

        const createTask = {
            title,
            description,
            status,
            dueDate,
            userId: user.id,
            tag,
            comment
        };

        await Task.create(createTask);
        return res.status(201).json({message: "Task successfully created"})
    }catch (error) {
        res.status(500).json({message: "Internal Server Error" + error.message});
        console.log(error);
    }
});

// Users can update the status of their own tasks and Admins can update the status of any task

app.patch("/task/:userId/:taskId", async (req, res) => {
    try {
      const { status } = req.body;
      const { taskId, userId } = req.params;

    if (!status || !userId || !taskId) {
        return res
          .status(400)
          .json({ message: "Status, taskId and userId are required" });
      }

      const user = await User.findByPk({ where: {id: userId}});
        if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

    const task = await Task.findByPk({ where: { id: taskId}});
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      if(user.role == 'admin') {
        await Task.update({ status}, {where: { id: taskId}});
        return res.status(200).json({ message: `Task updated successfully`});
      };
  
      if(user.id !== task.userId) {
        return res.status(403).json({ message: "User cannot edit status of this"})
      }

    await Task.update({ status}, {where: { id: taskId}});
    return res.status(200).json({ message: "Task updated successfully"});
      
    } catch (error) {
      res.status(500).json({ message: "Internal server Error" + error.message });
      console.log(error);
    }
  });

  app.delete("/delete-task/:userId/:taskId", async (req, res) => {
    try {
      const { taskId, userId } = req.params;
  
  
      const user = await User.findByPk(userId);
      const task = await Task.findByPk(taskId);
  
      if (!user) {
        return res.status(400).json({ message: "User does not exist" });
      }
  
      if (task) {
          if (user.role === "admin" || task.userId === user.id)
        {
          await Task.destroy({ where: { id: taskId } });
          return res.status(200).json({ message: "Task deleted successfully" });
        } else {
          return res
            .status(400)
            .json({ message: "You do not have permission to delete this task" });
        }
      } else {
        return res.status(400).json({ message: "Task does not exist" });
      }
    } catch (error) {
       res
        .status(500)
        .json({ message: "Internal server error " + error.message });
        
        console.log(error);
    }
  });

// GET USERS
// get all user

app.get('/users', async(req, res) => {
  try{
      const users = await User.findAll();
      if(!users) {
          return res.status(404).json({ message: `No user found`});
      };
      return res.status(200).json({ message: `All users retrieved successfully`, users});

  } catch (error) {
      res.status(500).json({ message: `Internal server error ${error.message}` });
      console.log(error);
  };
})

//users by id
app.get('/users/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
      const user = await User.findOne({ where: {id: userId}});
      if (!user) {
          return res.status(404).json({ message: `User not found`});
      };

      return res.status(200).json({ message: `User has been successfully retrieved`, user});
  } catch (error) {
      res.status(500).json({ message: `Internal server error: ${error.message}` });
      console.log(error);
  };
});

//  GET TASKS
//get all tasks
app.get('/tasks', async (req, res) => {
  try{
      const tasks = await Task.findAll();
      if(!tasks) {
          return res.status(404).json({ message: `No task found`});
      };

      return res.status(200).json({ message: `All tasks retrieved successfully`, tasks});

  } catch (error) {
      res.status(500).json({ message: `Internal server error: ${error.message}` });
      console.log(error);
  };
});

// get tasks by id
app.get('/tasks/:taskId', async (req, res) => {
  const { taskId } = req.params;

  try {
      const task = await Task.findOne({ where: {id: taskId}});
      if (!task) {
          return res.status(404).json({ message: `Task not found`});
      };

      return res.status(200).json({ message: `Task has been successfully retrieved`, task});
  } catch (error) {
      res.status(500).json({ message: `Internal server error: ${error.message}` });
      console.log(error);
  };
});

//GET COMMENT
//all comment
app.get('/comments', async (req, res) => {

  try{
      const comments = await Comment.findAll();

      return res.status(200).json({ message: `Comments retrieved successfully`, comments});

  }catch (error) {
      res.status(500).json({ message: `Internal server error: ${error.message}` });
      console.log(error);
  };
});
  
  app.put("/task-comment/:commentId", async (req, res)=>{
      const {comment, createdFor, createdBy} = req.body
      const {taskId} = req.params
  
      
  });



app.listen(3000, async () => {
    try {
        await sequelize.sync();
        console.log(`The server is running on port 3000`);
    } catch (error) {
        console.log(error)
    }

});