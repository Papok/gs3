import MongoClient from 'mongodb'
import fs from 'fs'

let dbuser = 'c9';
let dbpassword = 'c9c9c9';
let url = `mongodb://${dbuser}:${dbpassword}@ds111492.mlab.com:11492/hgs3d`;

let my_collection_name = (fs.existsSync("devenviro"))? 'expenditures_dev' : 'expenditures'

function watch(f) {
    MongoClient.connect(url, function(err, client) {
        if (err) {
            console.log("Error connecting to database. [watch]");
            console.log(err);
        }
        else {
            let db = client.db('hgs3d');
            let expenditures_collection = db.collection(my_collection_name);
            let change_stream = expenditures_collection.watch([{
                $project: { documentKey: false }
            }]);
            change_stream.on("change", function(change) {
                console.log(change);
            });
        }
        f(err);
    });
}


function save_expenditures(expenditures, f) {
    console.log("Saving", expenditures.length)
    MongoClient.connect(url, function(err, client) {
        if (err) {
            console.log("Error connecting to database.");
            console.log(err);
            f(err);
            return;
        }
        let db = client.db('hgs3d');
        let expenditures_collection = db.collection(my_collection_name);
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
    });
}

function load_expenditures(f) {
    MongoClient.connect(url, function(err, client) {
        if (err) {
            console.log("Error connecting to database.");
            console.log(err);
            f(err);
            return;
        }
        let db = client.db('hgs3d');
        let expenditures_collection = db.collection(my_collection_name);
        expenditures_collection.find().toArray(function(err, docs) {
            if (err) {
                console.log("Error retriving from database.");
                console.log(err);
                f(err);
                return
            }
            f(err, docs)
        })
    })
}

export { watch, save_expenditures, load_expenditures };


