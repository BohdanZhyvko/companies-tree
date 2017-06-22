var objectId = require('mongodb').ObjectID;
var assert = require('assert');

var updateEarnings = {

  updateBranch: function updateAll(db, collectionName, id, sumEstimatedEarnings = 0) {
    db.collection(collectionName).findOne({"_id": objectId(id)},
    function(err, doc){
        assert.equal(null, err);

        if(doc.childId != ''){
          sumEstimatedEarnings += parseInt(doc.estimatedEarnings);
          db.collection(collectionName).updateOne({"_id": objectId(id)},
            {$set:{ "estimatedEarningsWithChild" : sumEstimatedEarnings }},
            function(err, result) {
              assert.equal(null, err);
              console.log('Item updated');
          });
        }else{
          sumEstimatedEarnings = parseInt(doc.estimatedEarnings);
        }
        if(doc.parentId != ''){
          return updateAll(db, collectionName, doc.parentId, sumEstimatedEarnings);
        }else{
          db.close();
          return 1;
        }
   });
 },

 updateBranchInPosition: function (db, collectionName, id, sumEstimatedEarnings = 0){
    db.collection(collectionName).findOne({"_id": objectId(id)},
    function(err, doc){
        assert.equal(null, err);
        if(doc.parentId != ''){
           updateEarnings.updateBranch(db, collectionName, doc.parentId,
             doc.estimatedEarningsWithChild);
        }
   });
 }
}

module.exports = updateEarnings;
