var objectId = require('mongodb').ObjectID;
var assert = require('assert');

var updateEarnings = {

  updateBranch: function update(db, collectionName, id, sumEstimatedEarnings = 0) {
    db.collection(collectionName).findOne({'_id': objectId(id)},
    function(err, doc){
        assert.equal(null, err);

        if(doc.childId != '' && doc.childId != null){
          sumEstimatedEarnings += parseInt(doc.estimatedEarnings);
          db.collection(collectionName).updateOne({'_id': objectId(id)},
            {$set:{ "estimatedEarningsWithChild" : sumEstimatedEarnings }},
            function(err, result) {
              assert.equal(null, err);
              console.log('Item updated');
          });
        }else{
          sumEstimatedEarnings = parseInt(doc.estimatedEarnings);
        }
        if(doc.parentId != '' && doc.parentId != null){
          return update(db, collectionName, doc.parentId, sumEstimatedEarnings);
        }else{
          return 1;
        }
   });
 },

 updateBranchInPosition: function (db, collectionName, id, sumEstimatedEarnings = 0){
    db.collection(collectionName).findOne({'_id': objectId(id)},
    function(err, doc){
        assert.equal(null, err);
        if(doc.parentId != ''){
          if(doc.estimatedEarningsWithChild != '' && doc.estimatedEarningsWithChild != null ){
            sumEstimatedEarnings = parseInt(doc.estimatedEarningsWithChild);
            console.log(sumEstimatedEarnings + 'it is with child');
          }else {
            sumEstimatedEarnings = parseInt(doc.estimatedEarnings);
            console.log(sumEstimatedEarnings + 'it is estimatedEarnings');
          }
          updateEarnings.updateBranch(db, collectionName, doc.parentId,
             sumEstimatedEarnings);
        }
   });
 }
}

module.exports = updateEarnings;
