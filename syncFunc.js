/*
Utility Functions
*/

const {initializeDatabases,getDatabases} = require("./database.js");
const the = require('await-the');
const cron = require("node-cron");
const faker = require("@faker-js/faker");

// API to send each document to in order to sync.
const sendEvent = data => {
    const { sourceDb, targetDb } = getDatabases();
    return targetDb.update({ _id: data._id },data, { upsert: true });
};

 // Update all data with amount greater than a value
const touch = async() => {                                       
    const { sourceDb, targetDb } = getDatabases();
    console.log("Updating any data with amount greater than 50000...\n")
    await sourceDb.update({ "amount": { $gt: 50000 }}, { $set: { owner: 'Amount Greater Than 50000' } },{ multi : true });
};

// Utility to log record sourceDb
const readSource = async () => {   
    const { sourceDb } = getDatabases();                          
    const record = await sourceDb.find();
    console.log("Showing sourceDb...\n");
    console.log(record);
};

// Utility to log record targetDb before/after action 
const readTarget = async when => {   
    const { targetDb } = getDatabases();                          
    const record = await targetDb.find();
    if (when == "before"){
        console.log("Showing targetDb before sync...\n");
    }
    else if (when == "after"){
        console.log("Showing targetDb after sync...\n");
    }
    else {
      console.log("Showing targetDb...\n");
    }
  
    console.log(record);
};
              

/*
Get all records out of the database and send them using sendEvent()
*/

const syncAllNoLimit = async () => {
    try {               
        const { sourceDb, targetDb } = getDatabases();
        // assuming that memory can handle the entire db size
        sendEvent(await sourceDb.find());         
        // return the targetDb count for testing
        return await targetDb.count()                            
    } 
    catch (err) {
        console.error("Error while syncAllNoLimit", err);
    }
};//end syncAllNoLimit


/*
Sync up to the provided limit of records.
*/

const syncWithLimit = async (limit, data) => {
    try {
        const { sourceDb, targetDb } = getDatabases();
        targetDb.remove({}, { multi: true })
      
        // checks to see if limit is a positive integer, since limit should be positive
        if (Number.isInteger(limit) == false || limit < 0){     
            console.error("Limit must be a positive integer");
            return "Limit not a positive integer"
            }
        // if the limit is larger than size of db, set limit to db size
        else if (limit > await sourceDb.count()){              
            limit = await sourceDb.count()
            console.log("Limit reduced to max size")
          
            // limit sets the number of syncs that are made
            sendEvent(await sourceDb.find().limit(limit));      
            return targetDb.count() 
            }
        else{
            // limit sets the number of syncs that are made
            sendEvent(await sourceDb.find().limit(limit));      
            }
        // return the targetDb count for testing
        return await targetDb.count()                           

        }
    catch (err) {
       console.error("Error while syncAllNoLimit", err);
        }
  }//end syncWithLimit


/*
Synchronize all records in batches.
*/

const syncAllSafely = async (batchSize, data) => {
    const { sourceDb, targetDb } = getDatabases();
    
    // keep track of how many to skip each batch
    let sent = 0                                                
   
    try {
          // checks to see if batchSize is a positive integer less than sourceDb size, if any is true, set batchSize to 1
          if (Number.isInteger(batchSize) == false || batchSize < 0 ||batchSize > await sourceDb.count() ){  
              console.error("batchSize must be a positive integer less than the sourceDb size, batchSize was set to 1");
              batchSize = 1
          }
          targetDb.remove({}, { multi: true })
      
          // while unsynched data still exists in the sourceDB
          do {                                                  
              // sort by descending update time
              data = await sourceDb.find().sort({updatedAt:-1}).skip(sent).limit(batchSize);          
              
              // if batch has data, insert to targetDb 
              if (data.length > 0) {                            
                  await sendEvent(data);
                  sent += batchSize;
                  }
              }//end of do loop 
          while (data.length>0);
        
           // return the targetDb count for testing
          return await targetDb.count()                        
        }//end of try
    catch (err) {
        console.error("Error while syncAllSafely", err);
        }
}//end syncAllSafely




// without using remove
const syncAllSafelyNoRemove = async (batchSize, data) => {    
    const { sourceDb, targetDb } = getDatabases();
    
    // keep track of how many to skip each batch
    let sent = 0                                                
   
    try {
          // checks to see if batchSize is a positive integer less than sourceDb size, if any is true, set batchSize to 1
          if (Number.isInteger(batchSize) == false || batchSize < 0 ||batchSize > await sourceDb.count() ){  
              console.error("batchSize must be a positive integer less than the sourceDb size, batchSize was set to 1");
              batchSize = 1
          }
          // while unsynched data still exists in the sourceDB
          do {                                                  
              // sort by descending update time
              data = await sourceDb.find().sort({updatedAt:-1}).skip(sent).limit(batchSize);          
              
              // if batch has data, insert to targetDb
              if (data.length > 0) {                             
                  try{
                  await targetDb.update({ _id: data._id },data, { upsert: true });
                  }
                  catch (err) {}
                  sent += batchSize;
                  }
              }//end of do loop 
          while (data.length>0);
      
          // return the targetDb count for testing
          return await targetDb.count()                         
        }//end of try
    catch (err) {
        console.error("Error while syncAllSafely", err);
        }
}//end syncAllSafely

 
/*
Sync changes since the last time the function was called 
*/
  
// syncs new or updated data in sourceDb
const syncNewChanges = async () => {                            
  
    // Run syncAllSafely periodically to account for deleted data from sourceDb
    const { sourceDb, targetDb } = getDatabases();
   
    try {
        // get the last updated entry from targetDb  
        const lastUpdatedInTargetDb = await targetDb.findOne().sort({ updatedAt:-1 });
         
        // get the time that will be compared by the sourceDb
        lastUpdatedTime = lastUpdatedInTargetDb.updatedAt.getTime() 
       
        let sent = 0;

        do {
            // find the data from sourceDb needed to be synced
            recentSource = await sourceDb.findOne().sort({updatedAt:-1}).skip(sent);
            updateTime = recentSource.updatedAt.getTime()
            if (updateTime > lastUpdatedTime) {
                await sendEvent(recentSource);
                sent += 1;
  
                // if the entire sourceDb needed to be updated
                if(sent == await sourceDb.count()){             
                    console.log("Entire SourceDb was synced")
                    console.log("Newly Synced Number: "+ sent);
                  
                    // no more data left after this one so break
                    break                                       
                }
            }//end of time comparison
            
            else{
                console.log("Newly Synced Number: "+ sent +"\n");
                }
            
            }//end of do loop 
        while (updateTime > lastUpdatedTime);
      
        // return the sent count for testing
        return sent              
      
        }//end of try
    catch (err) {
        console.error("Error while syncNewChanges", err);
    }
}//end syncNewChanges



/*
Synchronize(): check the source database for updates to sync
*/

const synchronize = () => {
    const { sourceDb, targetDb } = getDatabases();
     
    // keeps number of syncNewChanges ran
    let counter = 0                                              
  
    // repeat syncNewChanges every 10 seconds
    cron.schedule("*/10 * * * * *", async () => {                
          console.info("synchronizing...");
      
          try {
              // create new data to insert into sourceDb
              let new_input =({                                  
                  name: "New Name",
                  owner: "New Owner",
                  amount: "New Amount",
              });
            
              await sourceDb.insert(new_input)
              console.log("inserting 1 new data...")
              console.log("Performing syncNewChanges...");
            
              // perform syncNewChanges to sync new and updated data
              await syncNewChanges();                           

              counter += 1;
              
              // repeat this every multiples of 5 syncs
              if (counter > 0 && counter % 5 == 0){              
                  console.log("Number of syncNewChanges ran: " + counter);
                  console.log("Performing syncAllSafely...");
                  
                  // syncAllSafely will acount for any deletes that occured in sourceDb
                  await syncAllSafely(5);                        
                
                  // show targetDb data to check if new data was synced
                  await readTarget("after");                  
                
              }//end condition to run syncAllSafely
          }//end of try
      
          catch (err) {
              console.error("Error while synchronizing", err);
          }
      });//end of schedule
};//end synchronize


/* 
Exports
*/
module.exports = {
synchronize,
syncAllNoLimit,
syncWithLimit,
syncAllSafely,
syncAllSafelyNoRemove,
syncNewChanges,
sendEvent,
touch,
readTarget,
readSource,
};
