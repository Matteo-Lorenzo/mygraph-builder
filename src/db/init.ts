require('dotenv').config()

import { User, GraphModel, History } from '../models'

const syncDB = process.env.SYNC_DB === 'yes'

// inizializzazione e sincronizzazione del database
async function dbInit () {
    await User.sync({ alter: syncDB });
    await GraphModel.sync({ alter: syncDB });
    await History.sync({ alter: syncDB });
  }

export default dbInit 