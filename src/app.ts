import express, { Request, Response, NextFunction } from "express"
import bcrypt from "bcrypt"
import { QueryResult } from "pg"
import dotenv from "dotenv"
import jwt from 'jsonwebtoken'
import bodyParser from 'body-parser';
import Joi from 'joi';
import multer from 'multer'
import { pool } from './db'
import { authenticate,authorizeAdmin } from './middleware';



dotenv.config({ path: './config.env' });
const port = 3002;

interface users {
  name: string;
  email: string;
  password: string;
  role: string;
}


interface results {
  student_id: number;
  subject: string;
  marks: number;

}
export const getuserresult = async (): Promise<users[]> => {
  const query = 'SELECT * FROM results';
  const result: QueryResult = await pool.query(query);
  return result.rows;
};
export const createuser = async (users: users): Promise<users> => {
  const query = 'INSERT INTO users(name,email password,role) VALUES($1, $2, $3, $4) RETURNING *';
  const values = [users.name, users.email, users.password, users.role,];
  const result: QueryResult = await pool.query(query, values);
  return result.rows[0];
};

export const createresult = async (student: results): Promise<results> => {
  const query = 'INSERT INTO results (student_id,subject,marks) VALUES($1, $2, $3) RETURNING *';
  const values = [student.student_id, student.subject, student.marks];
  const result: QueryResult = await pool.query(query, values);
  return result.rows[0];
};

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
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}


function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN!, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}
const app = express();
app.use(bodyParser.json());


// Register a new user
app.post('/register', async (req: Request, res: Response) => {
  try {
    const { error } = userSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const { name, email, password, role } = req.body;

    // Check if user with same email already exists
    const existingEmail = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingEmail.rows.length > 0) {
      return res.status(409).json({ error: 'Email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query('INSERT INTO users (name,email, password,role) VALUES ($1, $2, $3, $4) RETURNING *', [name, email, hashedPassword, role]);

    // const token = jwt.sign({id: user.id},'your-secret-key');
    // res.status(201).json({user:result, token:token})

    const users = result.rows[0];
    res.status(201).json({ message: 'Register successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// Login as an existing user

app.get("/users", authenticateToken, authenticate, async (req: Request, res: Response) => {
  try {
    const user: users[] = await getuserresult();
    res.json({ user });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal server error");
  }
});

// user login 
app.post('/login',async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  if (user.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid email or password' });
  }

  const validPassword = await bcrypt.compare(password, user.rows[0].password);
  if (!validPassword) {
      return res.status(400).json({ message: 'Invalid email or password' });
  }
  
  const accessToken = jwt.sign({ id: user.rows[0].id, role: user.rows[0].role }, process.env.ACCESS_TOKEN as string, { expiresIn: '1h' });
  
  res.json({ accessToken });
});




app.get('/verify', authenticateToken, (req, res) => {
  res.json({ message: 'verify token' });
});


//  user addresult  for users
app.post('/results', authenticateToken,authorizeAdmin,authenticate, async (req, res) => {
  try {
  const { error } = studentSchema.validate(req.body);
  if (error) {
  return res.status(400).json({ message: error.details[0].message });
  }
  const student_id = req.user.id;
  
  const user = await pool.query('SELECT * FROM users WHERE id = $1', [student_id]);
  if (user.rows.length === 0) {
      return res.status(400).json({ message: 'User not found' });
  }
  
  if (user.rows[0].role !== 'admin') {
      return res.status(403).json({ message: 'Access forbidden' });
  }
  
  const result = await pool.query('INSERT INTO results (student_id, subject, marks) VALUES ($1, $2, $3) RETURNING *', [req.body.student_id, req.body.subject, req.body.marks]);
  res.json({ message: `Result added successful` });
  } catch (err) {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
  }
  });


// Update result record (only admin)
app.put('/results/:student_id', authenticateToken,authorizeAdmin,authenticate, async (req: Request, res: Response) => {
  const { error } = studentSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  const studentId = req.params.student_id;
  const { subject, marks } = req.body;

  const student_id = req.user.id;
  const user = await pool.query('SELECT * FROM users WHERE id = $1', [student_id]);
  if (user.rows.length === 0) {
    return res.status(400).json({ message: 'User not found' });
  }
  if (user.rows[0].role !== 'admin') {
    return res.status(403).json({ message: 'Access forbidden' });
  }

  pool.query(
    'UPDATE results SET subject = $2, marks = $3 WHERE student_id = $1',
    [student_id,subject, marks],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error updating student record');
      }
      return res.send({ message: `Result  student id ${studentId} updated ` });
    }
  );
}
);

// Delete result record
app.delete('/results/:student_id', authenticateToken, authorizeAdmin,authenticate, async (req: Request, res: Response) => {
  const id = req.params.student_id;
  pool.query(
    'DELETE FROM results WHERE student_id = $1',
    [id],
    async (err: any, result: any) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error deleting result record');
      }
      const student_id = req.user.id;
      const user = await pool.query('SELECT * FROM users WHERE id = $1', [student_id]);
      if (user.rows.length === 0) {
      return res.status(400).json({ message: 'User not found' });
  }
      if (user.rows[0].role !== 'admin') {
        return res.status(403).json({ message: 'Access forbidden' });
    }
      if (result.rowCount === 0) {
        return res.status(404).send(`No result record found with ID: ${id}`);
      }
      return res.json({ message: `Deleteing Result student_id ${id}` });
    }
  );
});



// student login

app.get("/student/login", authenticateToken,authorizeAdmin,authenticate, async (req: Request, res: Response) => {
  try {
    const { error } = studentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const query = 'SELECT * FROM results';
    const result: QueryResult = await pool.query(query);
    const students: results[] = result.rows;
    res.json({ students });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal server error");
  }
});

app.get('/results/:student_id', authenticateToken, (req: Request, res: Response) => {
  const { error } = studentSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  const studentId = req.params.student_id;
  pool.query(
    'SELECT * FROM results WHERE student_id = $1',
    [studentId],
    (err: any, result: any) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error fetching result records');
      }
      if (result.rows.length === 0) {
        return res.status(404).send(`No result records found for student with ID: ${studentId}`);
      }
      return res.json({ "message": "Result Table", data: [result.rows] });
    }
  );
});

// user upload profile picture

// Define storage for profile picture uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './upload/images');
  },
  filename: function (req, file, cb) {
    cb(null, `${file.filename}_${Date.now}_${file.originalname}`)
  }
});

const multerConfig = multer({
  storage: storage, limits: {
    fileSize: 1024 * 1024 * 4
  }
});

// Define the API 
app.post('/users/profile-picture', multerConfig.single('profilePicture'), (req: Request, res: Response) => {
  if (req.file) {
    // File was uploaded successfully
    res.status(200).json({ message: 'User uploaded profile picture' });
  } else {
    // File was not uploaded successfully
    res.status(400).json({ message: 'User profile picture upload failed' });
  }
});
app.get('/user/profilepicture', authenticateToken, (req: Request, res: Response) => {
  //user profile 
});

app.listen(port, () => {
  console.log("Server running on port:", port);
});





