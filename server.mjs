//import * as logic from '../common/logic_classes.js';
//import * as logic from '/home/ubuntu/workspace/client/common/logic_classes.mjs';
import * as logic from './client/common/logic_classes.mjs';
import * as db from './db.mjs';
import * as mdb from './mdb.mjs';

import http from 'http';
import path from 'path';

import socketio from 'socket.io';
import express from 'express';

let router = express();
let server = http.createServer(router);
let io = socketio.listen(server);
io.set('log level', 2);

router.use(express.static(path.resolve(path.resolve(), 'client')));

let categories = [];
let categories_names = ['Super', 'Farmacia', 'Educación', 'Extra-curricular', 'Esparcimiento', 'Gastos Casa', 'Comida Afuera'];
for (let categorie of categories_names) {
    categories.push(new logic.Category(categorie));
}

let buyers = [];
let buyers_names = ['Julieta', 'Papo'];
for (let buyer of buyers_names) {
    buyers.push(new logic.Buyer(buyer));
}

let pay_methods = [];
let pay_methods_names = ['Efectivo',
    'Comafi Crédito', 'Comafi Débito',
    'Galicia Visa Crédito', 'Galicia Visa Débito',
    'Galicia Máster Crédito', 'Galicia Máster Débito',
    'Santander Crédito', "Santander Débito",
    'Nación Débito'
];

for (let pay_method of pay_methods_names) {
    pay_methods.push(new logic.PayMethod(pay_method));
}


var expenditures = [];

console.log("--gs3--")

var messages = [];
var sockets = [];

io.on('connection', function(socket) {
    messages.forEach(function(data) {
        socket.emit('message', data);
    });

    sockets.push(socket);

    socket.on('disconnect', function() {
        sockets.splice(sockets.indexOf(socket), 1);
    });

    socket.on('go', (username) => {
        remote_log('going')
        if (username == "papo") {
            db.load_init_file((err, file_data) => {
                if (err) {
                    remote_log("Error loading init data.");
                }
                else {
                    let init_data = JSON.parse(file_data);
                    socket.emit('init', init_data);
                }
                mdb.load_expenditures((err, data) => {
                    if (err) {
                        remote_log("Error loading expenditures data.");
                    }
                    else {
                        expenditures = data;
                        socket.emit('update_expenditures', expenditures);
                    }
                });
            });
        }
        else {
            remote_log("wrong username");
        }
    });

    socket.on('update_categories', function() {
        remote_log('sending categories');
        socket.emit('update_categories', categories);
    });

    socket.on('new_category', function(category) {
        categories.push(category);
        broadcast('update_categories', categories);
    });

    socket.on('add_expenditure', function(expenditure) {
        // console.log("Adding", expenditure)
        // console.log("To", expenditures)
        let new_expenditure = new logic.Expenditure(expenditure);
        expenditures.push(new_expenditure);
        // console.log("Resulting in", expenditures)
        upsert_expenditure(new_expenditure);
    });

    socket.on('edit_expenditure', function(expenditure) {
        let edit_expenditure_idx = expenditures.findIndex(item => item.uid === expenditure.uid);
        let edit_expenditure = new logic.Expenditure(expenditure);
        expenditures[edit_expenditure_idx] = edit_expenditure;
        upsert_expenditure(expenditure);
    });

    socket.on('delete_expenditure', function(expenditure_uid) {
        // console.log("Deleting", expenditure_uid)
        // console.log("From", expenditures)
        let idx = expenditures.findIndex(expenditure => expenditure.uid === expenditure_uid);
        if (idx > -1) {
            expenditures.splice(idx, 1);
        }
        else {
            remote_log("Error trying to delete expenditure.");
            // console.log("error deleting", expenditure_uid)
        }
        delete_expenditure(expenditure_uid);
    });

    socket.on('delete_category', function(category) {
        remove_from_list(categories, category);
        broadcast('update_categories', categories);
    });

    socket.on('backlog', function(msg) {
        remote_log(msg);
    });

    function load_expenditures() {
        mdb.load_expenditures((err, data) => {
            if (err) {
                remote_log("Error loading expenditures data.");
            }
            else {
                expenditures = data;
                socket.emit('update_expenditures', expenditures);
            }
        });
    }

    // function save_expenditures() {
    //     console.log("Saving_s", expenditures.length) // somehow, this line, prevents a bug where, sometimes, expenditures is looks empty inside this function... when invoqued from a cell phone request, but ot a desktop... . May be this is because this function is defined insde the socket? May be it shoukld be outside?
    //     mdb.save_expenditures(expenditures, (err) => {
    //         if (err) {
    //             remote_log("Error accessing expenditure file (mdb).");
    //         }
    //         else {
    //             broadcast("update_expenditures", expenditures);
    //             console.log("broadcasting", expenditures)
    //         }
    //     })
    // }

    function remote_log(text) {
        socket.emit('remote_log', text);
    }
});


function upsert_expenditure(expenditure) {
    // console.log("Upserting");
    mdb.upsert_expenditure(expenditure, (err) => {
        if (err) {
            console.log("Error upserting expenditure file.", err);
        }
        else {
            broadcast("update_expenditures", expenditures);
            // console.log("broadcasting", expenditures);
        }
    });
}

function delete_expenditure(expenditure_uid) {
    console.log("Deleting");
    mdb.delete_expenditure(expenditure_uid, (err) => {
        if (err) {
            console.log("Error deleting expenditure.", err);
        }
        else {
            broadcast("update_expenditures", expenditures);
            // console.log("broadcasting", expenditures);
        }
    })
}

function broadcast(event, data) {
    sockets.forEach(function(socket) {
        socket.emit(event, data);
    });
}

function remove_from_list(list, element) {
    var index = list.indexOf(element);
    if (index > -1) {
        list.splice(index, 1);
    }
    else {
        console.log("ERROR: Element not found in index.");
    }
}

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function() {
    var addr = server.address();
    console.log("gs3 server listening at", addr.address + ":" + addr.port);
});
