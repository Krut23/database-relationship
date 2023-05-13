import { Model, DataTypes, INTEGER } from 'sequelize';
import sequelize from '../database';


class Result extends Model {
  public student_id!: number;
  public subject!: string;
  public marks!: number;
  
}

Result.init({
  student_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue:null
   
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  marks: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'results',
  sequelize,
  timestamps: false,
});



export default Result;
