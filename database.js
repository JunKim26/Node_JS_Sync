/*
Initialize Database
*/

const the = require('await-the');
const { faker } = require("@faker-js/faker");
const _ = require('lodash');
const Datastore = require("nedb-promises");

let sourceDb;
let targetDb;

const initializeDatabases = () => {
    // The source database to sync updates from.
    sourceDb = new Datastore({                                 
        inMemoryOnly: true,
        timestampData: true
    });
    
    // The target database that sendEvents() will write too.
    targetDb = new Datastore({                                
        inMemoryOnly: true,
        timestampData: true
    });
};

const getDatabases = () => ({ sourceDb, targetDb });

// initializing companies
const load = async () => {
    const { sourceDb, targetDb } = getDatabases();                                      
    const companies = [];                                      
    const length = 10;                                         
    
    // creates length number of data and pushes to the company array
    for (let i = 0; i < length; i++) {                         
        companies.push({
        name: faker.company.companyName(),
        owner: faker.name.firstName(),
        amount: faker.datatype.number(),
      });
    }
    
    // lodash iterate each data and insert into sourceDb
    _.forEach(companies, async function (company) {            
        await sourceDb.insert(company);
        await the.wait(300);
    });
}


/* 
Exports
*/
module.exports = {
  initializeDatabases,
  getDatabases,
  load
}
