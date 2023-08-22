import { Sequelize } from 'sequelize-typescript';
import { Dialect } from 'sequelize'
require('dotenv').config()

const dbName = process.env.POSTGRES_DB as string;
const dbUser = process.env.POSTGRES_USER as string;
const dbHost = process.env.DB_HOST;
const dbPort = (process.env.DB_PORT === null)?5432:parseInt(process.env.DB_PORT!);
const dbDriver = process.env.DB_DRIVER as Dialect;
const dbPassword = process.env.POSTGRES_PASSWORD;
const dbLogging = process.env.LOGGING === "yes";

const sequelizeConnection = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: dbDriver,
  logging: dbLogging
})



export default sequelizeConnection