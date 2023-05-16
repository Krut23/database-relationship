import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import Joi from 'joi';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../model/usermodel';
import '../database'

dotenv.config();

const pattern = '^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{5,10})';
const message = { 'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' }
const userSchema = Joi.object({
  name: Joi.string().required(),
  password: Joi.string().pattern(new RegExp(pattern)).required().messages(message),
  email: Joi.string().email().required(),
  role: Joi.string().valid('admin', 'student').required()
  
});
const loginSchema = Joi.object({
  password: Joi.string().pattern(new RegExp(pattern)).required().messages(message),
  email: Joi.string().email().required(),
  
});

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { error} = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email: req.body.email } });
     if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const match = await bcrypt.compare(req.body.password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // user has access to the requested record
    if (req.params.id && (Number(req.params.id) !== user.id && user.role !== 'admin')) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const accessToken = jwt.sign({ id: user.id, role: user.role }, process.env.ACCESS_TOKEN as string, { expiresIn: '10h' });
    res.json({ accessToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export default {loginUser};
