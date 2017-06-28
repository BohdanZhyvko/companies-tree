var express = require('express');
var router = express.Router();
var mongo = require('mongodb').MongoClient;
var objectId = require('mongodb').ObjectID;
var db = require('../config/db.js');
var collectionName = String(db.collectionName);
var assert = require('assert');
var updateDB = require('./update_earnings.js');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/get-data', function(req, res, next) {
  var resultArray = [];
  mongo.connect(db.url, function(err, db) {
    assert.equal(null, err);
    var cursor = db.collection(collectionName).find();
    cursor.forEach(function(doc, err) {
      assert.equal(null, err);
      resultArray.push(doc);
    }, function() {
      db.close();
      res.render('index', {items: resultArray});
    });
  });
});

router.post('/insert', function(req, res, next) {
  var parent;
  var child;

  var item = {
    name: req.body.name,
    estimatedEarnings: req.body.estimatedEarnings,
    parentId: req.body.parentId,
    childId: req.body.childId
  };

  mongo.connect(db.url, function(err, db) {
    assert.equal(null, err);
    insert();
    //update parent
    if(item.parentId != ''){
      db.collection(collectionName).findOne({'_id': objectId(item.parentId)},
        function(err, doc) {
          assert.equal(null, err);
            db.collection(collectionName).find({}).toArray(function(err, docs) {
                updateOne( item.parentId ,{'childId' : docs[docs.length-1]._id});
            });
      });
    }
    //update child
    if (item.childId != '') {
      db.collection(collectionName).findOne({'_id': objectId(item.childId)},
        function(err, doc) {
          assert.equal(null, err);
            db.collection(collectionName).find({}).toArray(function(err, docs) {
                updateOne( item.childId ,{'parentId' : docs[docs.length-1]._id});
            });
      });
    }
    //insert in mongo db new data
    function insert(){
      db.collection(collectionName).insert(item, function(err, result) {
        assert.equal(null, err);
        console.log('Item inserted');
      });
    }
    //update child and parent, and math all branches
    function updateOne(id, item) {
      db.collection(collectionName).updateOne({'_id': objectId(id)}, {$set: item},
      function(err, result) {
        assert.equal(null, err);
        console.log('Item updated');

          //update all earnings data in DB
        db.collection(collectionName).find({'childId' : ''}).toArray(function(err, docs){

           for(var i = 0; i < docs.length; i++){
             console.log(docs[i]);
             updateDB.updateBranch(db, collectionName, docs[i]._id );
           }
        });
      });
    }
  });

  res.redirect('/');
});

router.post('/update', function(req, res, next) {
  var item = {
    name: req.body.name,
    estimatedEarnings: req.body.estimatedEarnings,
    estimatedEarningsWithChild: req.body.estimatedEarningsWithChild,
    parentId: req.body.parentId,
    childId: req.body.childId
  };
  var id = req.body.id;

  mongo.connect(db.url, function(err, db) {
    assert.equal(null, err);
    db.collection(collectionName).updateOne({'_id': objectId(id)}, {$set: item},
    function(err, result) {
      assert.equal(null, err);
      console.log('Item updated');
      db.close();
    });
  });
});
// Delete method
router.post('/delete', function(req, res, next) {
  var id = req.body.id;

  mongo.connect(db.url, function(err, db) {
    assert.equal(null, err);
    db.collection(collectionName).findOne({'_id': objectId(id)},
      function(err, doc) {
        var writeParentItem = {
          childId: doc.childId
        };
        var writeChildItem = {
          parentId: doc.parentId
        };

//Overwriting parent and child when we delete a data
      if(doc.childId != '' && doc.parentId != ''){
            var write = [writeParentItem, writeChildItem];
            var writeId = [doc.parentId, doc.childId];
            for(var i = 0; i < write.length; i++){
              db.collection(collectionName).updateOne({'_id': objectId(writeId[i])},
                {$set: write[i]}, function(err, result) {
                assert.equal(null, err);
                console.log('Item updated');
            });
            }
        }else if (doc.parentId != '') {
            db.collection(collectionName).updateOne({'_id': objectId(doc.parentId)},
              {$set: {childId : ""}}, function(err, result) {
              assert.equal(null, err);
              console.log('Item updated');
            });
        }else if (doc.childId != ''){
          db.collection(collectionName).updateOne({'_id': objectId(doc.childId)},
          {$set: {parentId : ""}}, function(err, result) {
            assert.equal(null, err);
            console.log('Item updated');
          });
        }

       //Delete data
       db.collection(collectionName).deleteOne({'_id': objectId(id)},
        function(err, result) {
         assert.equal(null, err);
         console.log('Item deleted');
         //update data in DB
         if(doc.childId !='' && doc.parentId != ''){
            updateDB.updateBranchInPosition(db, collectionName, doc.childId );
         }else if (doc.parentId != '') {
            updateDB.updateBranch(db, collectionName, doc.parentId );
         }
       });

    });
  });
});

module.exports = router;
