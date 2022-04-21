//==============================================================================================================
//                                              Utility Functions
//==============================================================================================================

const {initializeDatabases,getDatabases} = require("./database.js");
const the = require('await-the');
const cron = require("node-cron");
const faker = require("@faker-js/faker");


                                                                  // API to send each document to in order to sync.
const sendEvent = data => {
    const { sourceDb, targetDb } = getDatabases();
    return targetDb.update({ _id: data._id },data, { upsert: true });
};
 
const touch = async() => {                                        // Update all data with amount greater than a value
    const { sourceDb, targetDb } = getDatabases();
    console.log("Updating any data with amount greater than 50000...\n")
    await sourceDb.update({ "amount": { $gt: 50000 }}, { $set: { owner: 'Amount Greater Than 50000' } },{ multi : true });
};

const readSource = async () => {   
    const { sourceDb } = getDatabases();                          // Utility to log record sourceDb
    const record = await sourceDb.find();
    console.log("Showing sourceDb...\n");
    console.log(record);
};

const readTarget = async when => {   
    const { targetDb } = getDatabases();                          // Utility to log record targetDb before/after action 
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
              
//==============================================================================================================
//                        Get all records out of the database and send them using sendEvent()
//==============================================================================================================
const syncAllNoLimit = async () => {
    try {               
        const { sourceDb, targetDb } = getDatabases();
        sendEvent(await sourceDb.find());                        // assuming that memory can handle the entire db size
        return await targetDb.count()                            // return the targetDb count for testing
    } 
    catch (err) {
        console.error("Error while syncAllNoLimit", err);
    }
};//end syncAllNoLimit

 //==============================================================================================================
 //                                    Sync up to the provided limit of records.
 //==============================================================================================================
  const syncWithLimit = async (limit, data) => {
    try {
        const { sourceDb, targetDb } = getDatabases();
        targetDb.remove({}, { multi: true })
        if (Number.isInteger(limit) == false || limit < 0){     // checks to see if limit is a positive integer
            console.error("Limit must be a positive integer");
            return "Limit not a positive integer"
            }
        else if (limit > await sourceDb.count()){               // if the limit is larger than size of db, set limit to db size
            limit = await sourceDb.count()
            console.log("Limit reduced to max size")
            sendEvent(await sourceDb.find().limit(limit));      // limit sets the number of syncs that are made
            return targetDb.count() 
            }
        else{
            sendEvent(await sourceDb.find().limit(limit));      // limit sets the number of syncs that are made
            }
        return await targetDb.count()                           // return the targetDb count for testing

        }
    catch (err) {
       console.error("Error while syncAllNoLimit", err);
        }
  }//end syncWithLimit

//==============================================================================================================
//                                        Synchronize all records in batches.
//==============================================================================================================
 const syncAllSafely = async (batchSize, data) => {
    const { sourceDb, targetDb } = getDatabases();

    let sent = 0                                                // keep track of how many to skip each batch
   
    try {
        // checks to see if batchSize is a positive integer less than sourceDb size, if any is true, set batchSize to 1
          if (Number.isInteger(batchSize) == false || batchSize < 0 ||batchSize > await sourceDb.count() ){  
              console.error("batchSize must be a positive integer less than the sourceDb size, batchSize was set to 1");
              batchSize = 1
          }
          targetDb.remove({}, { multi: true })
          do {                                                  // while unsynched data still exists in the sourceDB
                                                                // sort by descending update time
              data = await sourceDb.find().sort({updatedAt:-1}).skip(sent).limit(batchSize);          
            
              if (data.length > 0) {                            // if batch has data, insert to targetDb 
                  await sendEvent(data);
                  sent += batchSize;
                  }
              }//end of do loop 
          while (data.length>0);
          return await targetDb.count()                         // return the targetDb count for testing
        }//end of try
    catch (err) {
        console.error("Error while syncAllSafely", err);
        }
 }//end syncAllSafely





 const syncAllSafelyNoRemove = async (batchSize, data) => {     // does not use remove on targetDb before sync
    const { sourceDb, targetDb } = getDatabases();

    let sent = 0                                                // keep track of how many to skip each batch
   
    try {
        // checks to see if batchSize is a positive integer less than sourceDb size, if any is true, set batchSize to 1
          if (Number.isInteger(batchSize) == false || batchSize < 0 ||batchSize > await sourceDb.count() ){  
              console.error("batchSize must be a positive integer less than the sourceDb size, batchSize was set to 1");
              batchSize = 1
          }
          do {                                                  // while unsynched data still exists in the sourceDB
                                                                // sort by descending update time
              data = await sourceDb.find().sort({updatedAt:-1}).skip(sent).limit(batchSize);          
            
              if (data.length > 0) {                            // if batch has data, insert to targetDb 
                  try{
                  await targetDb.update({ _id: data._id },data, { upsert: true });
                  }
                  catch (err) {}
                  sent += batchSize;
                  }
              }//end of do loop 
          while (data.length>0);
          return await targetDb.count()                         // return the targetDb count for testing
        }//end of try
    catch (err) {
        console.error("Error while syncAllSafely", err);
        }
 }//end syncAllSafely

//==============================================================================================================
//                          Sync changes since the last time the function was called 
//==============================================================================================================
//lastUpdatedTime = new lasttime

//sourcedb.find("createdat or updatedat > lastupdatedtime")
const syncNewChanges = async () => {                            // syncs new or updated data in sourceDb
                                                                // Run syncAllSafely periodically to account for deleted data from sourceDb
    const { sourceDb, targetDb } = getDatabases();
   
    try {
                                                                // get the last updated entry from targetDb  
        const lastUpdatedInTargetDb = await targetDb.findOne().sort({ updatedAt:-1 });
                                                                // get the time that will be compared by the sourceDb
        lastUpdatedTime = lastUpdatedInTargetDb.updatedAt.getTime() 
       
        let sent = 0;
                    //recentSource = sourceDb.find("query to find lastUpdatedInTargetDb <= sourceDb").sort.....
                    //find most recent from source Db :recentSource.findOne().sort({ updatedAt:-1 });
                    //data = find the range of data that falls in between 
                    //sendevent(data)
        do {
                                                                // find the data from sourceDb needed to be synced
            recentSource = await sourceDb.findOne().sort({updatedAt:-1}).skip(sent);
            updateTime = recentSource.updatedAt.getTime()
            if (updateTime > lastUpdatedTime) {
                await sendEvent(recentSource);
                sent += 1;

                if(sent == await sourceDb.count()){             // if the entire sourceDb needed to be updated
                    console.log("Entire SourceDb was synced")
                    console.log("Newly Synced Number: "+ sent);
                    break                                       // no more data left after this one so break
                }
            }//end of time comparison
            
            else{
                console.log("Newly Synced Number: "+ sent +"\n");
                }
            
            }//end of do loop 
        while (updateTime > lastUpdatedTime);
        return sent                                             // return the sent count for testing
        }//end of try
    catch (err) {
        console.error("Error while syncNewChanges", err);
    }
 }//end syncNewChanges



//==============================================================================================================
//                        Synchronize(): check the source database for updates to sync
//==============================================================================================================

const synchronize = () => {
    const { sourceDb, targetDb } = getDatabases();
    
    let counter = 0                                              // keeps number of syncNewChanges ran
  
    cron.schedule("*/10 * * * * *", async () => {                // repeat syncNewChanges every 10 seconds
          console.info("synchronizing...");
      
          try {
              let new_input =({                                  // create new data to insert into sourceDb
                  name: "New Name",
                  owner: "New Owner",
                  amount: "New Amount",
              });
            
              await sourceDb.insert(new_input)
              console.log("inserting 1 new data...")
              console.log("Performing syncNewChanges...");
            
              await syncNewChanges();                            // perform syncNewChanges to sync new and updated data

              counter += 1;

              if (counter > 0 && counter % 5 == 0){              // repeat this every multiples of 5 syncs
                  console.log("Number of syncNewChanges ran: " + counter);
                  console.log("Performing syncAllSafely...");
    
                  await syncAllSafely(5);                        // syncAllSafely will acount for any deletes that occured in sourceDb
                  await readTarget("after");                     // show targetDb data to check if new data was synced
              }//end condition to run syncAllSafely
          }//end of try
          catch (err) {
              console.error("Error while synchronizing", err);
          }
      });//end of schedule
};//end synchronize


                                                                 // Exports
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
