import multer from 'multer';
import { Request, Response } from 'express';
import fs from 'fs';
import User from '../model/usermodel';


const imageDir = './upload/images'; 

// create the directory
if (!fs.existsSync(imageDir)) {
  fs.mkdirSync(imageDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imageDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}_${Date.now()}_${file.originalname}`);
  }
});

const multerConfig = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 4
  }
});

const uploadProfilePicture = async (req:Request, res:Response) => {
  const userId = req.params.userId;
  const profilePictureUrl = req.file?.filename ? `${req.protocol}://${req.get('host')}/upload/images/${req.file.filename}` : undefined;

  if (!req.file) {
    return res.status(400).json({
      message: 'Profile picture missing',
    });
  }

  try {
    const user = await User.findOne({where: {id: userId}});

    if (!user) {
      return res.status(404).json({message: 'User not found'});
    }

    if (profilePictureUrl) {
      user.profilePictureUrl = profilePictureUrl;
      await user.save();

      return res.status(200).json({message: 'User uploaded profile picture',profilePictureUrl});
    } else {
      return res.status(400).json({
        message: 'User profile picture not uploaded',
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
}

export { multerConfig,uploadProfilePicture }  
