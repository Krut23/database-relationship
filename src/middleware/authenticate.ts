import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../model/usermodel';

dotenv.config();

declare global {
    namespace Express {
      interface Request {
        token?: any;
      }
    }
  }
const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Authentication failed' });
    }

    const decoded: any = jwt.verify(token, process.env.ACCESS_TOKEN!);
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Authentication failed' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

export default authenticate;
