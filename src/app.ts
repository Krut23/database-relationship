import express, { Request, Response, NextFunction } from "express"
import bcrypt from "bcrypt"
import { QueryResult} from "pg"
import dotenv from "dotenv"
import  jwt from 'jsonwebtoken' 
import bodyParser from 'body-parser';
import Joi from 'joi';
import multer from 'multer'
import { pool } from './db'
import { authenticate } from './middleware';



dotenv.config({ path: './config.env' });
const port = 3002;

interface users  {
    username:string;
    password: string;
    name: string;
    email: string;
   
}
interface Student {
    name: string;
    student_id: number;
    total_marks: number;
    exam_type: string;
    
}
export const getuserresult = async (): Promise<users[]> => {
  const query = 'SELECT * FROM Student';
  const result: QueryResult = await pool.query(query);
  return result.rows;
};
export const createuser = async (users: users): Promise<users> => {
  const query = 'INSERT INTO users(username, password,name, email) VALUES($1, $2, $3, $4) RETURNING *';
  const values = [users.username, users.password, users.name, users.email];
  const result: QueryResult = await pool.query(query, values);
  return result.rows[0];
};

export const createresult = async (student: Student): Promise<Student> => {
    const query = 'INSERT INTO Student (student_id,name,total_marks,exam_type) VALUES($1, $2, $3, $4) RETURNING *';
    const values = [student.student_id,student.name,student.total_marks,student.exam_type];
    const result: QueryResult = await pool.query(query, values);
    return result.rows[0];
};

const pattern = '^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{5,10})';
const message = {'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'}
// Joi schema for user
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
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}
const secret = "your-secrect-key"

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
app.post('/register' , async (req:Request, res:Response) => {
    try {
      const { error } = userSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }
      const { username, password, name, email } = req.body;

       // Check if user with same username already exists
      const existingUser = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Username is already used' });
    }
    // Check if user with same email already exists
    const existingEmail = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingEmail.rows.length > 0) {
      return res.status(409).json({ error: 'Email is already registered' });
    }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await pool.query('INSERT INTO users (username, password, name, email) VALUES ($1, $2, $3, $4) RETURNING *', [username, hashedPassword, name, email]);
      
      // const token = jwt.sign({id: user.id},'your-secret-key');
      // res.status(201).json({user:result, token:token})

      const users = result.rows[0];
      res.status(201).json({message: 'Register successful'});
    } catch (err) 
    {
      console.error(err);
      res.status(500).json({ error: 'Something went wrong' });
    }
  });

  // Login as an existing user

  app.get("/users",authenticateToken,authenticate, async (req:Request, res:Response) => {
    try {
        const user: users[] = await getuserresult();
        res.json({ user });
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal server error");
    }
});

// user login 
app.post('/login', async (req:Request, res:Response) => {
  try {
    const { error } = userSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const { username, password } = req.body;
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username);
    const result = await pool.query(`SELECT * FROM users WHERE ${isEmail ? 'email' : 'username'} = $1`, [username]);
    const user = result.rows[0];
    
    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user.id }, secret, { expiresIn: '10h' });
      res.json({ access_token :token });
    } else {
      res.status(400).json({ error: 'Invalid username or password' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});


app.get('/verify',authenticateToken, (req, res) => {
  res.json({ message: 'verify token' });
});


//  user addresult  for users
app.post('/results', authenticateToken, async (req: Request, res: Response) => {
  const { student_id, name, exam_type, total_marks } = req.body;

  try {
    
    // Validate request body
    await studentSchema.validateAsync(req.body);

    // Insert result in database
    await pool.query('INSERT INTO Student (student_id, name, exam_type, total_marks) VALUES ($1, $2, $3, $4)', 
    [student_id, name, exam_type, total_marks]);

    return res.status(200).json({ message: 'Result added successfully' });
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: `error.message` });
  }
});


// Update result record 
app.put('/results/:student_id',authenticateToken,authenticate,  async (req: Request, res: Response) => {
  const { error } = userSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  const studentId = req.params.student_id;
  const { name, total_marks,exam_type } = req.body;

  pool.query(
    'UPDATE Student SET name = $1, total_marks = $2, exam_type = $3 WHERE student_id = $4',
    [name, total_marks,exam_type, studentId],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error updating student record');
      }
          return res.send({message:`Result  student id ${studentId} updated `});
        }
      );
    }
  );

// Delete result record
app.delete('/results/:student_id',authenticateToken,authenticate, async (req:Request, res:Response) => {
  const id = req.params.student_id;
  pool.query(
      'DELETE FROM Student WHERE student_id = $1',
      [id],
      (err: any, result: any) => {
          if (err) {
              console.error(err);
              return res.status(500).send('Error deleting result record');
          }
          if (result.rowCount === 0) {
              return res.status(404).send(`No result record found with ID: ${id}`);
          }
          return res.json({message:`Deleteing Result student_id ${id}`});
      }
  );
});

  

// student login

app.get("/student/login",authenticateToken,authenticate, async (req:Request, res:Response) => {
    try {
      const { error } = studentSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      }
        const query = 'SELECT * FROM student';
        const result: QueryResult = await pool.query(query);
        const students: Student[] = result.rows;
        res.json({ students });
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal server error");
    }
});

app.get('/results/:student_id',authenticateToken,authenticate, (req:Request, res:Response) => {
  const { error } = studentSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  const studentId = req.params.student_id;
  pool.query(
      'SELECT * FROM Student WHERE student_id = $1',
      [studentId],
      (err: any, result: any) => {
          if (err) {
              console.error(err);
              return res.status(500).send('Error fetching result records');
          }
          if (result.rows.length === 0) {
              return res.status(404).send(`No result records found for student with ID: ${studentId}`);
          }
          return res.json({"message":"Result Table", data: [result.rows]});
      }
  );
});

// user upload profile picture

// Define storage for profile picture uploads
const storage = multer.diskStorage({
  destination: (req, file, cb)=> {
    cb(null, './upload/images');
  },
  filename: function (req, file, cb) {
    cb(null,`${file.filename}_${Date.now}_${file.originalname}`)
  }
});

const multerConfig = multer({ storage:storage,limits: {
  fileSize: 1024 * 1024 * 4 }});

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





