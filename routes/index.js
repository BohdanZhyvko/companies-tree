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
    res.render('index', {
        title: 'Express'
    });
});

router.get('/get-data-tree', function(req, res, next) {
    var str = '-';
    var resultArray = [];

    mongo.connect(db.url, function(err, db) {
        assert.equal(null, err);

        db.collection(collectionName).find({
            'parentId': ''
        }).toArray(function(err, docs) {

          // start working sync method for get result from db
            var i = 0;
            createAllTree();
            // sync method for get tree
            function createAllTree() {
                if (i < docs.length) {
                    resultArray.push(parseToString('', docs[i]));

                    if (docs[i].childId != '' && docs[i].childId != null) {
                        getBranchRec(docs[i].childId);
                    } else {
                        i++;
                        createAllTree();
                    }
                } else {
                    db.close;
                    res.render('index', {
                        printData: resultArray
                    });
                }
            }
            // mthod for get child in branch
            function getBranchRec(id) {
                db.collection(collectionName).findOne({
                        '_id': objectId(id)
                    },
                    function(err, res) {
                        assert.equal(null, err);
                        resultArray.push(parseToString(str, res));
                      //  console.log(res.name);
                        if (res.childId != '' && res.childId != null) {
                            str += '-';
                            return getBranchRec(res.childId, resultArray);
                        } else {
                          // init new branch and go to it
                            i++;
                            str = '-';
                            createAllTree();
                        }
                    });
                return true;
            }
            //parse data for print in page
            function parseToString(str, doc){
              var estimatedEarningsWithChild;
              if(doc.estimatedEarningsWithChild != '' && doc.estimatedEarningsWithChild != null){
                estimatedEarningsWithChild = doc.estimatedEarningsWithChild;;
              }else {
                estimatedEarningsWithChild = '';
              }
              return (str + ' '+ doc.name + ' | ' + doc.estimatedEarnings + ' | '
               + estimatedEarningsWithChild + ' | ' + doc.parentId + ' | '
               + doc.childId + ' | ' + doc._id);
            }
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
        if (item.parentId != '') {
            db.collection(collectionName).findOne({
                    '_id': objectId(item.parentId)
                },
                function(err, doc) {
                    assert.equal(null, err);
                    db.collection(collectionName).find({}).toArray(function(err, docs) {
                        updateOne(item.parentId, {
                            'childId': docs[docs.length - 1]._id
                        });
                    });
                });
        }
        //update child
        if (item.childId != '') {
            db.collection(collectionName).findOne({
                    '_id': objectId(item.childId)
                },
                function(err, doc) {
                    assert.equal(null, err);
                    db.collection(collectionName).find({}).toArray(function(err, docs) {
                        updateOne(item.childId, {
                            'parentId': docs[docs.length - 1]._id
                        });
                    });
                });
        }
        //insert in mongo db new data
        function insert() {
            db.collection(collectionName).insert(item, function(err, result) {
                assert.equal(null, err);
                console.log('Item inserted');
            });
        }
        //update child and parent, and math all branches
        function updateOne(id, item) {
            db.collection(collectionName).updateOne({
                    '_id': objectId(id)
                }, {
                    $set: item
                },
                function(err, result) {
                    assert.equal(null, err);
                    console.log('Item updated');

                    //update all earnings data in DB
                    db.collection(collectionName).find({
                        'childId': ''
                    }).toArray(function(err, docs) {

                        for (var i = 0; i < docs.length; i++) {
                            updateDB.updateBranch(db, collectionName, docs[i]._id);
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
        db.collection(collectionName).findOne({
                '_id': objectId(id)
            },
            function(err, doc) {
                assert.equal(null, err);

                if (item.parentId == doc.parentId) {
                    //updete in new branch
                    updateChild(id, item.childId);
                    //update in old branch
                    update(doc.childId, {
                        'parentId': ''
                    });
                } else if (doc.parentId != '' && doc.parentId != null) {
                    update(doc.parentId, {
                        'childId': doc.childId
                    });
                }
                if (item.childId == doc.childId) {
                    //updete in new branch
                    updateParent(id, item.parentId);
                    //update in old branch
                    update(doc.parentId, {
                        'childId': ''
                    });
                } else if (doc.childId != '' && doc.childId != null) {
                    update(doc.childId, {
                        'parentId': doc.parentId
                    });
                }

                if (item.parentId != '' && item.parentId != null) {
                    update(item.parentId, {
                        'childId': id
                    });
                }
                if (item.childId != '' && item.childId != null) {
                    update(item.childId, {
                        'parentId': id
                    });
                }
                update(id, item);
                //update all earnings data in DB
                db.collection(collectionName).find({
                    'childId': ''
                }).toArray(function(err, docs) {

                    for (var i = 0; i < docs.length; i++) {
                        updateDB.updateBranch(db, collectionName, docs[i]._id);
                    }
                });
            });
        //update one data
        function update(id, item) {
            db.collection(collectionName).updateOne({
                    '_id': objectId(id)
                }, {
                    $set: item
                },
                function(err, result) {
                    assert.equal(null, err);
                    console.log('Item updated')
                });
        }
        //update new parent
        function updateParent(id, itemId) {
            db.collection(collectionName).findOne({
                    '_id': objectId(itemId)
                },
                function(err, doc) {
                    assert.equal(null, err);
                    if (doc.childId != '') {
                        db.collection(collectionName).updateOne({
                            '_id': objectId(doc.childId)
                        }, {
                            $set: {
                                'parentId': ''
                            }
                        }, function(err, result) {
                            assert.equal(null, err);
                            console.log('Item updated');
                        });
                    }
                });
        }
        //update new child
        function updateChild(id, itemId) {
            db.collection(collectionName).findOne({
                    '_id': objectId(itemId)
                },
                function(err, doc) {
                    assert.equal(null, err);
                    if (doc.childId != '') {
                        db.collection(collectionName).updateOne({
                            '_id': objectId(doc.parentId)
                        }, {
                            $set: {
                                'childId': ''
                            }
                        }, function(err, result) {
                            assert.equal(null, err);
                            console.log('Item updated');
                        });
                    }
                });
        }
    });
});
// Delete method
router.post('/delete', function(req, res, next) {
    var id = req.body.id;

    mongo.connect(db.url, function(err, db) {
        assert.equal(null, err);
        db.collection(collectionName).findOne({
                '_id': objectId(id)
            },
            function(err, doc) {
                var writeParentItem = {
                    childId: doc.childId
                };
                var writeChildItem = {
                    parentId: doc.parentId
                };

                //Overwriting parent and child when we delete a data
                if (doc.childId != '' && doc.parentId != '') {
                    var write = [writeParentItem, writeChildItem];
                    var writeId = [doc.parentId, doc.childId];
                    for (var i = 0; i < write.length; i++) {
                        db.collection(collectionName).updateOne({
                            '_id': objectId(writeId[i])
                        }, {
                            $set: write[i]
                        }, function(err, result) {
                            assert.equal(null, err);
                            console.log('Item updated');
                        });
                    }
                } else if (doc.parentId != '') {
                    db.collection(collectionName).updateOne({
                        '_id': objectId(doc.parentId)
                    }, {
                        $set: {
                            childId: ""
                        }
                    }, function(err, result) {
                        assert.equal(null, err);
                        console.log('Item updated');
                    });
                } else if (doc.childId != '') {
                    db.collection(collectionName).updateOne({
                        '_id': objectId(doc.childId)
                    }, {
                        $set: {
                            parentId: ""
                        }
                    }, function(err, result) {
                        assert.equal(null, err);
                        console.log('Item updated');
                    });
                }

                //Delete data
                db.collection(collectionName).deleteOne({
                        '_id': objectId(id)
                    },
                    function(err, result) {
                        assert.equal(null, err);
                        console.log('Item deleted');
                        //update data in DB
                        if (doc.childId != '' && doc.parentId != '') {
                            updateDB.updateBranchInPosition(db, collectionName, doc.childId);
                        } else if (doc.parentId != '') {
                            updateDB.updateBranch(db, collectionName, doc.parentId);
                        }
                    });

            });
    });
});

module.exports = router;
