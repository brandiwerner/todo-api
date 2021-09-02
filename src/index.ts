import { config } from "dotenv"
import { v4 as uuidv4 } from 'uuid';
import express from 'express';
import { MongoClient } from 'mongodb';
import cors from 'cors';

let mongoClient: MongoClient

config()

const app = express()
const port = 3001

// Database Connection
const CONNECTION_URL = process.env.DB_CONNECTION_URL as string
const DATABASE_NAME = "todo";

// Parse bodys of req
app.use(express.json());

//Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true}));

app.use(cors());

enum Priority {
    High = 'High',
    Medium = 'Medium',
    Low = 'Low'
}

interface TodoTask {
    id: string;
    description: string;
    isComplete: boolean;
    priority: Priority;
    dueDate: Date;
}

type CreateTodoTaskDTO = Pick<TodoTask, "description" | "dueDate" | "priority">
type EditTodoTaskDTO = Omit<Partial<TodoTask>, "id">

/**
 * Retrieve all todo items
 */
app.get('/todos', async (req, res) => {
    const collection = mongoClient.db(DATABASE_NAME).collection('todos')
    const foundData = await collection.find();

    const todos =  await foundData.toArray();

    res.json(todos);
})

/**
 * Retrieve todo item by id
 */
app.get('/todos/:id', async (req, res) => {
    const id = req.params.id;

    const collection = mongoClient.db(DATABASE_NAME).collection('todos')
    const foundData = await collection.findOne({id});
    
    res.json(foundData);
})

/**
 * Create a new todo
 */
app.post('/todos', async (req, res) => {
    const payload: CreateTodoTaskDTO = req.body

    // Validate payload contains all require keys
    if (!payload.description || typeof payload.description !== "string") {
        res.status(400).json({
            error: "Invalid description provided."
        })

        return
    }

    if (!payload.priority) {
        res.status(400).json({
            error: "Invalid priority provided."
        })
        
        return
    }

    const isEnum = payload.priority === Priority.High ||  payload.priority === Priority.Medium || payload.priority === Priority.Low 
    if (!isEnum) {
        res.status(400).json({
            error: "Invalid priority provided."
        })

        return
    }

    if (!payload.dueDate) {
        res.status(400).json({
            error: "Invalid dueDate provided."
        })

        return
    }

    const id = uuidv4();

    const newTask: TodoTask = {
        id,
        description: payload.description,
        isComplete: false,
        priority: payload.priority,
        dueDate: payload.dueDate
    }

    const collection = mongoClient.db(DATABASE_NAME).collection('todos')
    await collection.insertOne(newTask)

    const foundTodo = await collection.findOne({ id })

    res.json(foundTodo)
})

/** 
 * Delete a new todo
 */
app.delete('/todos/:id', async (req, res) => {
    const id =  req.params.id;

    // Validate payload contains all require keys
    if (!id || typeof id !== "string") {
        res.status(400).json({
            error: "Invalid id provided."
        })

        return
    }

    const collection = mongoClient.db(DATABASE_NAME).collection('todos')
    await collection.deleteOne({id})

    res.json({message: 'Todo Item successfully deleted'});
})

/**
 * Edit a todo
 */
app.patch('/todos/:id', async (req, res) => {
    const id =  req.params.id;
    const payload: EditTodoTaskDTO = req.body;

    // Validate payload contains all require keys
    if (!id || typeof id !== "string") {
        res.status(400).json({
            error: "Invalid id provided."
        })

        return
    }

    const collection = mongoClient.db(DATABASE_NAME).collection('todos');

    // Get the todo
    const todo = await collection.findOne({id});

    // Merge old todo and updated data
    const draftTodo = {
        ...todo,
        ...payload
    }

    const normalizedDraftTodo = Object.entries(draftTodo).filter(([key, value]) => {
        const isValidKey = ["description", "isComplete", "priority", "dueDate"].includes(key)
        if (isValidKey) {
            return true
        } else {
            return false
        }
    }).reduce((prev, [key, value]) => ({ ...prev, [key]: value }), {})

    const updatedTodo = await collection.updateOne({id}, {$set: normalizedDraftTodo})

    // Get the todo
    const newTodo = await collection.findOne({id});

    res.json(newTodo);
})

app.listen(port, () => {
    try {
        MongoClient.connect(CONNECTION_URL, (error, client) => {
            if(error) {
                throw error;
            }
            if (client) {
                mongoClient = client
            } else {
                throw new Error("mongo client not defined")
            }
            console.log("Connected to `" + DATABASE_NAME + "`!");
        })
    } catch (err) {
        console.log('MongoDB connection error. Please make sure MongoDB is running. ' + err)
        process.exit();
    }
})