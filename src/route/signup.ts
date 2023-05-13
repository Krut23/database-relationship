import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import Joi from 'joi';
import User from '../model/usermodel';
import '../database'

const pattern = '^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{5,10})';
const message = { 'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' }
const userSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().pattern(new RegExp(pattern)).required().messages(message),
  role: Joi.string().valid('admin', 'student').required()
  
});
export const signup = async (req: Request, res: Response) => {
  try {
    const { error, value } = userSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const { name, email, password, role } = value;

    // Check if user with same email already exists
    const existingEmail = await User.findOne({ where: { email: email } });
    if (existingEmail) {
      return res.status(409).json({ error: 'Email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name,
      email: email,
      password: hashedPassword,
      role: role
    });

    res.status(201).json({ message: 'Register successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

export default {signup};




