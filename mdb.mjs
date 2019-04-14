import MongoClient from "mongodb";
import fs from "fs";

let dbuser = "c9";
let dbpassword = "c9c9c9";
let url = `mongodb://${dbuser}:${dbpassword}@ds111492.mlab.com:11492/hgs3d`;

let my_collection_prefix = fs.existsSync("devenviro") ? "dev_" : "";

function watch(f) {
  MongoClient.connect(
    url,
    function(err, client) {
      if (err) {
        console.log("Error connecting to database. [watch]");
        console.log(err);
      } else {
        let db = client.db("hgs3d");
        let expenditures_collection = db.collection(my_collection_prefix);
        let change_stream = expenditures_collection.watch([
          {
            $project: { documentKey: false }
          }
        ]);
        change_stream.on("change", function(change) {
          console.log(change);
        });
      }
      f(err);
    }
  );
}

function save_expenditures(expenditures, f) {
  console.log("Saving", expenditures.length);
  let collection_name = my_collection_prefix + "expenditures";
  MongoClient.connect(
    url,
    function(err, client) {
      if (err) {
        console.log("Error connecting to database.");
        console.log(err);
        f(err);
        return;
      }
      let db = client.db("hgs3d");
      let expenditures_collection = db.collection(collection_name);
      expenditures_collection.drop(function(err) {
        if (err && err.code !== 26) {
          console.log("Error dropping expenditures.");
          console.log(err);
          f(err);
          return;
        }
        expenditures_collection.insert(expenditures, function(err, result) {
          if (err) {
            console.log("Error saving expenditures.");
            console.log(err);
            f(err);
            return;
          }
          client.close(function(err) {
            if (err) {
              console.log("Error closing database");
              console.log(err);
              f(err);
              return;
            }
            f(err);
          });
        });
      });
    }
  );
}

function load_expenditures(f) {
  let collection_name = my_collection_prefix + "expenditures";
  MongoClient.connect(
    url,
    function(err, client) {
      if (err) {
        console.log("Error connecting to database.");
        console.log(err);
        f(err);
        return;
      }
      let db = client.db("hgs3d");
      let expenditures_collection = db.collection(collection_name);
      expenditures_collection.find().toArray(function(err, docs) {
        if (err) {
          console.log("Error retriving from database.");
          console.log(err);
          f(err);
          return;
        }
        client.close(function(err) {
          if (err) {
            console.log("Error closing database");
            console.log(err);
            f(err);
            return;
          }
          f(err, docs);
        });
      });
    }
  );
}

function upsert_expenditure(expenditure, f) {
  let collection_name = my_collection_prefix + "expenditures";
  MongoClient.connect(
    url,
    function(err, client) {
      if (err) {
        console.log("Error connecting to database.");
        console.log(err);
        f(err);
        return;
      }
      let db = client.db("hgs3d");
      let expenditures_collection = db.collection(collection_name);
      expenditures_collection.updateOne(
        { uid: expenditure.uid },
        { $set: expenditure },
        { upsert: true },
        function(err, count, status) {
          if (err) {
            console.log("Error updating database.");
            console.log(err);
            f(err);
            return;
          }
          client.close(function(err) {
            if (err) {
              console.log("Error closing database");
              console.log(err);
              f(err);
              return;
            }
            f(err);
          });
        }
      );
    }
  );
}

function delete_expenditure(expenditure_uid, f) {
  let collection_name = my_collection_prefix + "expenditures";
  MongoClient.connect(
    url,
    function(err, client) {
      if (err) {
        console.log("Error connecting to database.");
        console.log(err);
        f(err);
        return;
      }
      let db = client.db("hgs3d");
      let expenditures_collection = db.collection(collection_name);
      expenditures_collection.deleteOne({ uid: expenditure_uid }, function(
        err,
        count,
        status
      ) {
        if (err) {
          console.log("Error updating expenditure.");
          console.log(err);
          f(err);
          return;
        }
        client.close(function(err) {
          if (err) {
            console.log("Error closing database");
            console.log(err);
            f(err);
            return;
          }
          f(err);
        });
      });
    }
  );
}

function save_records(records, collection_name, f) {
  console.log("Saving", records.length);
  let collection_fullname = my_collection_prefix + collection_name;
  MongoClient.connect(
    url,
    function(err, client) {
      if (err) {
        console.log("Error connecting to database.");
        console.log(err);
        f(err);
        return;
      }
      let db = client.db("hgs3d");
      let records_collection = db.collection(collection_fullname);
      records_collection.drop(function(err) {
        if (err && err.code !== 26) {
          console.log("Error dropping records.");
          console.log(err);
          f(err);
          return;
        }
        records_collection.insert(records, function(err, result) {
          if (err) {
            console.log("Error saving records.");
            console.log(err);
            f(err);
            return;
          }
          client.close(function(err) {
            if (err) {
              console.log("Error closing database");
              console.log(err);
              f(err);
              return;
            }
            f(err);
          });
        });
      });
    }
  );
}

function load_records(collection_name, f) {
  let collection_fullname = my_collection_prefix + collection_name;
  MongoClient.connect(
    url,
    function(err, client) {
      if (err) {
        console.log("Error connecting to database.");
        console.log(err);
        f(err);
        return;
      }
      let db = client.db("hgs3d");
      let records_collection = db.collection(collection_fullname);
      records_collection.find().toArray(function(err, docs) {
        if (err) {
          console.log("Error retriving from database.");
          console.log(err);
          f(err);
          return;
        }
        client.close(function(err) {
          if (err) {
            console.log("Error closing database");
            console.log(err);
            f(err);
            return;
          }
          f(err, docs);
        });
      });
    }
  );
}

function upsert_record(record, collection_name, f) {
  let collection_fullname = my_collection_prefix + collection_name;
  MongoClient.connect(
    url,
    function(err, client) {
      if (err) {
        console.log("Error connecting to database.");
        console.log(err);
        f(err);
        return;
      }
      let db = client.db("hgs3d");
      let records_collection = db.collection(collection_fullname);
      records_collection.updateOne(
        { uid: record.uid },
        { $set: record },
        { upsert: true },
        function(err, count, status) {
          if (err) {
            console.log("Error updating database.");
            console.log(err);
            f(err);
            return;
          }
          client.close(function(err) {
            if (err) {
              console.log("Error closing database");
              console.log(err);
              f(err);
              return;
            }
            f(err);
          });
        }
      );
    }
  );
}

function delete_record(record_uid, collection_name, f) {
  let collection_fullname = my_collection_prefix + collection_name;
  MongoClient.connect(
    url,
    function(err, client) {
      if (err) {
        console.log("Error connecting to database.");
        console.log(err);
        f(err);
        return;
      }
      let db = client.db("hgs3d");
      let records_collection = db.collection(collection_fullname);
      records_collection.deleteOne({ uid: record_uid }, function(
        err,
        count,
        status
      ) {
        if (err) {
          console.log("Error updating record.");
          console.log(err);
          f(err);
          return;
        }
        client.close(function(err) {
          if (err) {
            console.log("Error closing database");
            console.log(err);
            f(err);
            return;
          }
          f(err);
        });
      });
    }
  );
}

function exists(coll_name, f) {
  let collection_name = my_collection_prefix + coll_name;
  MongoClient.connect(
    url,
    function(err, client) {
      if (err) {
        console.log("Error connecting to database.");
        console.log(err);
        f(err);
        return;
      }
      let db = client.db("hgs3d");
      db.listCollections({ name: collection_name }).next(function(
        err,
        collinfo
      ) {
        if (err) {
          console.log("Error retriving database collections info");
          console.log(err);
          f(err);
          return;
        }

        let res = collinfo ? true : false;
        // f(err, res);
        client.close(function(err) {
          if (err) {
            console.log("Error closing database");
            console.log(err);
            f(err);
            return;
          }
          f(err, res);
        });
      });
    }
  );
}

export {
  watch,
  save_expenditures,
  load_expenditures,
  upsert_expenditure,
  delete_expenditure,
  save_records,
  load_records,
  upsert_record,
  delete_record,
  exists
};
