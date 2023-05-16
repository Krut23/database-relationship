import { Request, Response,NextFunction } from 'express';
import bcrypt from 'bcrypt';
import Joi from 'joi';
import User from '../model/usermodel';
import '../database';
import dotenv from 'dotenv'

dotenv.config({ path: './config.env' });

// userSchema
const pattern = '^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{5,10})';
const message = { 'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' }
const userSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().pattern(new RegExp(pattern)).required().messages(message)
});

function getRole(email: string): string {
  const adminEmail = process.env.ADMIN_EMAIL;

  if (adminEmail && new RegExp(adminEmail).test(email)) {
    return 'admin';
  } else {
    return 'student';
  }
}

export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { error, value } = userSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const { name, email, password } = value;

    const existingEmail = await User.findOne({ where: { email: email } });
    if (existingEmail) {
      return res.status(409).json({ error: 'Email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const role = getRole(email);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    // Add record level access control here
    if (user.role === 'admin') {
      return res.status(201).json({ message: 'Register successful' });
    } else {
      if (user.id !== req.user.id) {
        return res.status(403).json({ error: ' do not have permission to access this record' });
      } else {
        return res.status(201).json({ message: 'Register successful' });
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

export default {signup};