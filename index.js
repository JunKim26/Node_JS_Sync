/*
Title : Database Sync Project
Author: Jun Kim
Date: 04/2022
Description: In this project, a synchronize() method is implemented that copies all records 
from a sourceDb into a targetDb() then start polling for changes.
*/

const the = require('await-the');
const {initializeDatabases,getDatabases,load} = require("./database.js");
const {synchronize, syncAllNoLimit, syncWithLimit, syncAllSafely,syncAllSafelyNoRemove, syncNewChanges, touch, readSource,readTarget} = require("./syncFunc.js");

                                                          
//Initialize Database and Load Data                            
initializeDatabases()                                         
load()                  

// Refer to test.js for official testing
