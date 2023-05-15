import { Model, DataTypes } from 'sequelize';
import sequelize from '../database';

class User extends Model {
  public id!: number;
  public name!: string;
  public email!: string;
  public password!: string;
  public role!:string;
  public profilePictureUrl!: string;
  static role: string;
 
 
}

User.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('admin', 'student'),
    allowNull: false,
  },
  profilePictureUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  }
}, {
  tableName: 'users',
  sequelize,
  timestamps: false,
});


export default User;
