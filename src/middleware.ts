
import express,{ Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'


const app = express();
app.use(express.json());
dotenv.config({ path: './config.env' });
declare global {
    namespace Express {
      interface Request {
        user?: any;
      }
    }
}
const ACCESS_TOKEN = "mysecretkey"
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authorization header is missing' });
  }

  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
export const authorizeAdmin = (req: Request, res: Response, next: () => void) => {
  const isAdmin = req.user && req.user.role === 'admin';
  if (!isAdmin) {
    return res.status(403).json({ error: 'Unauthorized access' });
  }
  next();
};

