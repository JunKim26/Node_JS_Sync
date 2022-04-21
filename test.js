//==============================================================================================================
//                                               Testing
//==============================================================================================================

//uses mocha for testing
const the = require('await-the');
const assert = require('assert');
const {initializeDatabases,getDatabases,load} = require("./database.js");
const {synchronize, syncAllNoLimit, syncWithLimit, syncAllSafely,syncAllSafelyNoRemove, syncNewChanges, touch, readTarget, readSource} = require("./syncFunc.js");

                                                                     // Initialize Database and Load Data
initializeDatabases()                                         
load()              

const { sourceDb, targetDb } = getDatabases();

describe('syncAllNoLimit', () => {                                   // asserts that all of sourceDb synced to targetDb
  it('syncAllNoLimit function synced correct number of data to targetDb', () => {
    return syncAllNoLimit().then(result => {
      assert.equal(result, 10);
    })
  })
})

describe('syncWithLimit', () => {                                    // asserts that limited number of sourceDb synced to targetDb
  it('syncWithLimit function synced correct number of data to targetDb', () => {
    return syncWithLimit(3).then(result => {
      assert.equal(result, 3);
    })
  })
})

describe('syncWithLimit Non-Int Limit', () => {                      // asserts that syncWithLimit returned proper result
  it('syncWithLimit function returned proper response', () => {
    return syncWithLimit("test").then(result => {
      assert.equal(result, "Limit not a positive integer");
    })
  })
})

describe('syncWithLimit Negative Int Limit', () => {                 // asserts that syncWithLimit returned proper result
  it('syncWithLimit function returned proper response', () => {
    return syncWithLimit(-1).then(result => {
      assert.equal(result, "Limit not a positive integer");
    })
  })
})

describe('syncWithLimit Limit greater than sourceDb', () => {        // asserts that limited number of sourceDb synced to targetDb
  it('syncWithLimit function synced correct number of data to targetDb', () => {
    return syncWithLimit(1000000).then(result => {
      assert.equal(result, 10);
    })
  })
})


describe('syncAllSafely Normal Input', () => {                       // asserts that all sourceDb synced to targetDb in batches
  it('syncAllSafely function synced correct number of data to targetDb', () => {
    return syncAllSafely(2).then(result => {
      assert.equal(result, 10);
    })
  })
})

describe('syncAllSafely No Input', () => {                           // asserts that all sourceDb synced to targetDb in batches with no input
  it('syncAllSafely function synced correct number of data to targetDb', () => {
    return syncAllSafely().then(result => {
      assert.equal(result, 10);
    })
  })
})

describe('syncAllSafely non-Int Input', () => {                      // asserts that all sourceDb safely synched with a non-int batch
  it('syncAllSafely function synced correct number of data to targetDb', () => {
    return syncAllSafely("test").then(result => {
      assert.equal(result, 10);
    })
  })
})

describe('syncAllSafely negative Input', () => {                     // asserts that all sourceDb safely synched with a negative batch
  it('syncAllSafely function synced correct number of data to targetDb', () => {
    return syncAllSafely(-1).then(result => {
      assert.equal(result, 10);
    })
  })
})

describe('syncAllSafely batchSize greater than sourceDb', () => {                    // asserts that all sourceDb safely synched with a batch > sourceDb
  it('syncAllSafely function synced correct number of data to targetDb', () => {
    return syncAllSafely(1000000).then(result => {
      assert.equal(result, 10);
    })
  })
})


describe('syncAllSafelyNoRemove', () => {                            // asserts that all sourceDb synced to targetDb in batches
  it('syncAllSafelyNoRemove function synced correct number of data to targetDb without removing from targetDb before sync', () => {
    return syncAllSafelyNoRemove(2).then(result => {
      assert.equal(result, 10);
    })
  })
})

describe('syncNewChanges Update Test', () => {                       // asserts that all sourceDb safely synched with a batch > sourceDb
  it('syncNewChanges function synced correct number of data to targetDb', () => {
    
    touch()                                                          // updates all data that has an amount greater than 50000
    readTarget("before");
    return syncNewChanges().then(result => {
      readTarget("after");
      assert.equal(result,result);
    })
  })
})

synchronize()
