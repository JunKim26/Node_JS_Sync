/*
Testing
*/

// uses mocha for testing
const the = require('await-the');
const assert = require('assert');
const {initializeDatabases,getDatabases,load} = require("./database.js");
const {synchronize, syncAllNoLimit, syncWithLimit, syncAllSafely,syncAllSafelyNoRemove, syncNewChanges, touch, readTarget, readSource} = require("./syncFunc.js");

// Initialize Database and Load Data
initializeDatabases()                                         
load()              

const { sourceDb, targetDb } = getDatabases();

// asserts that all of sourceDb synced to targetDb
describe('syncAllNoLimit', () => {                                   
  it('syncAllNoLimit function synced correct number of data to targetDb', () => {
    return syncAllNoLimit().then(result => {
      assert.equal(result, 10);
    })
  })
})

// asserts that limited number of sourceDb synced to targetDb
describe('syncWithLimit', () => {                                    
  it('syncWithLimit function synced correct number of data to targetDb', () => {
    return syncWithLimit(3).then(result => {
      assert.equal(result, 3);
    })
  })
})

// asserts that syncWithLimit returned proper result
describe('syncWithLimit Non-Int Limit', () => {                      
  it('syncWithLimit function returned proper response', () => {
    return syncWithLimit("test").then(result => {
      assert.equal(result, "Limit not a positive integer");
    })
  })
})

// asserts that syncWithLimit returned proper result
describe('syncWithLimit Negative Int Limit', () => {                 
  it('syncWithLimit function returned proper response', () => {
    return syncWithLimit(-1).then(result => {
      assert.equal(result, "Limit not a positive integer");
    })
  })
})

// asserts that limited number of sourceDb synced to targetDb
describe('syncWithLimit Limit greater than sourceDb', () => {        
  it('syncWithLimit function synced correct number of data to targetDb', () => {
    return syncWithLimit(1000000).then(result => {
      assert.equal(result, 10);
    })
  })
})

// asserts that all sourceDb synced to targetDb in batches
describe('syncAllSafely Normal Input', () => {                       
  it('syncAllSafely function synced correct number of data to targetDb', () => {
    return syncAllSafely(2).then(result => {
      assert.equal(result, 10);
    })
  })
})

// asserts that all sourceDb synced to targetDb in batches with no input
describe('syncAllSafely No Input', () => {                          
  it('syncAllSafely function synced correct number of data to targetDb', () => {
    return syncAllSafely().then(result => {
      assert.equal(result, 10);
    })
  })
})

// asserts that all sourceDb safely synched with a non-int batch
describe('syncAllSafely non-Int Input', () => {                      
  it('syncAllSafely function synced correct number of data to targetDb', () => {
    return syncAllSafely("test").then(result => {
      assert.equal(result, 10);
    })
  })
})

// asserts that all sourceDb safely synched with a negative batch
describe('syncAllSafely negative Input', () => {                     
  it('syncAllSafely function synced correct number of data to targetDb', () => {
    return syncAllSafely(-1).then(result => {
      assert.equal(result, 10);
    })
  })
})

// asserts that all sourceDb safely synched with a batch > sourceDb
describe('syncAllSafely batchSize greater than sourceDb', () => {                    
  it('syncAllSafely function synced correct number of data to targetDb', () => {
    return syncAllSafely(1000000).then(result => {
      assert.equal(result, 10);
    })
  })
})

// asserts that all sourceDb synced to targetDb in batches
describe('syncAllSafelyNoRemove', () => {                            
  it('syncAllSafelyNoRemove function synced correct number of data to targetDb without removing from targetDb before sync', () => {
    return syncAllSafelyNoRemove(2).then(result => {
      assert.equal(result, 10);
    })
  })
})

// asserts that all sourceDb safely synched with a batch > sourceDb
describe('syncNewChanges Update Test', () => {                       
  it('syncNewChanges function synced correct number of data to targetDb', () => {
    
    // updates all data that has an amount greater than 50000
    touch()                                                          
    readTarget("before");
    return syncNewChanges().then(result => {
      readTarget("after");
      assert.equal(result,result);
    })
  })
})

synchronize()
