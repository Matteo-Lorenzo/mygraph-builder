import User, { UserRole} from './user.model';
import GraphModel, { Grafo }  from './graph.model';
import History  from './history.model';
import sequelizeConnection from '../db/config';


sequelizeConnection.addModels([GraphModel, User, History])

export {
  User,
  GraphModel,
  History,
  UserRole,
  Grafo
}