//import * as logic from '../common/logic_classes.js';
//import * as logic from '/home/ubuntu/workspace/client/common/logic_classes.mjs';
import * as logic from './client/common/logic_classes.mjs';
import * as db from './db.mjs';
import * as mdb from './mdb.mjs';

import http from 'http';
import path from 'path';

import async from 'async';
import socketio from 'socket.io';
import express from 'express';

//
// ## SimpleServer `SimpleServer(obj)`
//
// Creates a new instance of SimpleServer with the following options:
//  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
//
let router = express();
let server = http.createServer(router);
let io = socketio.listen(server);
io.set('log level', 2);

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
var selected_category = "Super";


console.log("--gs3--")
router.use(express.static(path.resolve(path.resolve(), 'client')));
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

    socket.on('init', () => {
        db.load_init_file((err, file_data) => {
            if (err) {
                remote_log("Error loading init data.");
            }
            else {
                let init_data = JSON.parse(file_data);
                //let data = { init_data, expenditures };
                socket.emit('init', init_data);
            }
            db.load_expenditures((err, file_data) => {
                if (err) {
                    remote_log("Error loading expenditures data.");
                }
                else {
                    expenditures = JSON.parse(file_data);
                    //let data = { init_data, expenditures };
                    socket.emit('update_expenditures', expenditures);
                }
            });
        });
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
                    //let data = { init_data, expenditures };
                    socket.emit('init', init_data);
                }
                db.load_expenditures((err, file_data) => {
                    if (err) {
                        remote_log("Error loading expenditures data.");
                    }
                    else {
                        expenditures = JSON.parse(file_data);
                        //let data = { init_data, expenditures };
                        socket.emit('update_expenditures', expenditures);
                    }
                });
            });
        }
        else {
            remote_log("wrong username")
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

    socket.on('new_expenditure', function(expenditure) {
        let new_expenditure = new logic.Expenditure(expenditure);
        expenditures.push(new_expenditure);
        save_expenditures()
    });

    socket.on('edit_expenditure', function(expenditure) {
        let edit_expenditure_idx = expenditures.findIndex(item => item.uid === expenditure.uid)
        let edit_expenditure = new logic.Expenditure(expenditure);
        expenditures[edit_expenditure_idx] = edit_expenditure;
        save_expenditures()
    })

    socket.on('delete_expenditure', function(expenditure_uid) {
        let idx = expenditures.findIndex(expenditure => expenditure.uid === expenditure_uid);
        if (idx > -1) {
            expenditures.splice(idx, 1);
        }
        else {
            remote_log("Error trying to delete expenditure.");
            console.log(expenditure_uid)
        }
        db.save_expenditures(expenditures, (err) => {
            if (err) {
                remote_log("Error accessing expenditure file.");
                remote_log(JSON.stringify(err));
            }
            else {
                broadcast("update_expenditures", expenditures);
            }
        });
    });

    socket.on('delete_category', function(category) {
        remove_from_list(categories, category);
        broadcast('update_categories', categories);
    });

    socket.on('backlog', function(msg) {
        remote_log(msg);
    });

    function save_expenditures() {
        db.save_expenditures(expenditures, (err) => {
            if (err) {
                remote_log("Error accessing expenditure file.");
            }
            else {
                broadcast("update_expenditures", expenditures);
            }
        });
        mdb.save_expenditures(expenditures, (err) => {
            if (err) {
                remote_log("Error accessing expenditure file (mdb).");
            }
        })
    }

    function remote_log(text) {
        socket.emit('remote_log', text);
    }
});


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
