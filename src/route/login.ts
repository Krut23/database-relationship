import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import Joi from 'joi';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../model/usermodel';
import '../database'
import { Sequelize } from 'sequelize';


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



export const forgotPassword = async(req: Request, res: Response) => {
  const { email } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user) {
    res.status(404).send({ message: 'User not found' });
    return;
  }
  // Generate OTP
  const otp = Math.floor(Math.random() * 900000) + 100000;
  const otpExpiry = new Date(Date.now() + 30 * 60 * 1000); //30 minute 

  user.passwordResetOTP = otp;
  user.passwordResetOTPExpire = otpExpiry;
  await user.save();

  res.json({ message: 'OTP sent your Email id successfully' });
}


export const resetPassword = async (req: Request, res: Response) => {
  const { otp, newPassword } = req.body;

  try {
    const user = await User.findOne({where: {passwordResetOTP: otp.toString()}});
    
    if (!user || user.passwordResetOTPExpire === null ||user.passwordResetOTPExpire < new Date()) {
      return res.status(400).json({ message: ' Invalid and expired OTP' });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.passwordResetOTP = null;
    user.passwordResetOTPExpire = new Date(Date.now() + 30 * 60 * 1000);
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};




export default { loginUser,forgotPassword ,resetPassword };
