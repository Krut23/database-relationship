import express from 'express';
import Joi from 'joi';
import dotenv from 'dotenv';
import { Client } from 'pg';

const app = express();
app.use(express.json());
dotenv.config({ path: './config.env' });


const connectionString = `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`;

console.log("PG_CONNECTION_STRING: ", connectionString);

const client = new Client({
    connectionString
  });
  client.connect();

// Joi schema for user
const pattern = '^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{5,10})';
const message = { 'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' }
// Joi schema for user
const userSchema = Joi.object({
  name: Joi.string().required(),
  password: Joi.string().pattern(new RegExp(pattern)).required().messages(message),
  email: Joi.string().email().required(),
  role: Joi.string().valid('admin', 'student').required()
});
// Joi schema for student
const studentSchema = Joi.object({
  student_id: Joi.number().required(),
  subject: Joi.string().required(),
  marks: Joi.number().integer().min(0).max(100).required()
});

client.query(
    "CREATE TABLE users (id SERIAL PRIMARY KEY,name TEXT NOT NULL,email VARCHAR(255) UNIQUE NOT NULL,password VARCHAR(255) NOT NULL,role VARCHAR(20) NOT NULL);", (err: any, res: any) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log('created table user');
        client.end();
})


client.query(
    "CREATE TABLE results (id SERIAL PRIMARY KEY,student_id INTEGER ,subject VARCHAR(255) NOT NULL,marks INTEGER NOT NULL);", (err: any, res: any) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log('created table results');
        client.end();
})
app.listen(4001, () => {
    console.log("server run on 4001");
    });