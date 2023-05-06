import Joi from 'joi';
import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: './config.env' });


const connectionString = `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}`;

console.log("PG_CONNECTION_STRING: ", connectionString);
const client = new Client({
    connectionString
  });
  client.connect();

const schema = Joi.object({
  databaseName: Joi.string().required(),
});

const requestData = {
    databaseName: 'mydata',
  };
  const validationResult = schema.validate(requestData);
  
  if (validationResult.error) {
    console.error(validationResult.error);
    process.exit(1); 
  }
client.query(
  `CREATE DATABASE ${requestData.databaseName}`,
  (err, res) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log('created database');
    client.end();
  }
);


