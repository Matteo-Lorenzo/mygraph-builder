import User  from './user.model';
import GraphModel  from './graph.model';
import History  from './history.model';
import sequelizeConnection from '../db/config';


sequelizeConnection.addModels([GraphModel, User, History])

export {
  User,
  GraphModel,
  History
}