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
const message = {'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'}
const userSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string().pattern(new RegExp(pattern)).required().messages(message),
    name: Joi.string().required(),
    email: Joi.string().email().required(),
  });
  // Joi schema for student
  const studentSchema = Joi.object({
    student_id: Joi.number().required(),
    name: Joi.string().required(),
    total_marks: Joi.number().required(),
    exam_type: Joi.string().required()
  });

client.query(
    "CREATE TABLE users (id UUID NOT NULL DEFAULT gen_random_uuid(),username text NOT NULL,password text NOT NULL,name text NOT NULL,email text NOT NULL,UNIQUE (id));", (err: any, res: any) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log('created table user');
        client.end();
})


client.query(
    "CREATE TABLE Student (id UUID PRIMARY KEY NOT NULL DEFAULT gen_random_uuid(),student_id integer NOT NULL,name varchar(50) NOT NULL,total_marks integer NOT NULL,exam_type VARCHAR(20));", (err: any, res: any) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log('created table Student');
        client.end();
})
app.listen(4001, () => {
    console.log("server run on 4001");
    });