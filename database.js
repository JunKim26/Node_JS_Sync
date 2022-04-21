//==============================================================================================================
//                                       Initialize Databases
//==============================================================================================================
const the = require('await-the');
const { faker } = require("@faker-js/faker");
const _ = require('lodash');
const Datastore = require("nedb-promises");

let sourceDb;
let targetDb;

const initializeDatabases = () => {
    sourceDb = new Datastore({                                 // The source database to sync updates from.
        inMemoryOnly: true,
        timestampData: true
    });
    targetDb = new Datastore({                                 // The target database that sendEvents() will write too.
        inMemoryOnly: true,
        timestampData: true
    });
};

const getDatabases = () => ({ sourceDb, targetDb });

const load = async () => {
    const { sourceDb, targetDb } = getDatabases();                                      
    const companies = [];                                      // initializing companies
    const length = 10;                                         // set the size of data
    
    for (let i = 0; i < length; i++) {                         // creates length number of data and pushes to the company array
        companies.push({
        name: faker.company.companyName(),
        owner: faker.name.firstName(),
        amount: faker.datatype.number(),
      });
    }
    _.forEach(companies, async function (company) {            // lodash iterate each data and insert into sourceDb
        await sourceDb.insert(company);
        await the.wait(300);
    });
}


                                                               // Exports
module.exports = {
  initializeDatabases,
  getDatabases,
  load
}
