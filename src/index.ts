import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import './database';
import * as dotenv from 'dotenv';
import User from './model/usermodel';
import Result from './model/resultmodel';
import { addResult,updateResult, getResult } from './route/result';
import {signup} from './route/signup';
import { loginUser } from './route/login';
import { multerConfig , uploadProfilePicture } from './multer/profile';
import path from 'path';



dotenv.config({ path: './config.env' });
const port = 3002;
const app = express();
app.use(cors());
app.use(express.json());


// Set up User and Result models
User.sync();
Result.sync();

// Set up middleware to authenticate requests using JWT tokens
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Authorization header missing' });
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN!);
    req.user = decodedToken;

    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ message: 'Invalid token' });
  }
};
app.use('/upload/images', express.static(path.join(__dirname, 'upload', 'images')));

// Set up API routes
app.post('/user/signup', signup);
app.post('/user/login', loginUser);
app.post('/result', authenticateToken, addResult);
app.put('/result/:student_id', authenticateToken, updateResult);
app.get('/result', authenticateToken, getResult);
app.post('/users/profile-picture',authenticateToken, multerConfig.single('profilePicture'), uploadProfilePicture);



app.listen(port, () => {
  console.log("Server running on port:", port);
});
