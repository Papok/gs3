//import * as logic from '../common/logic_classes.js';
//import * as logic from '/home/ubuntu/workspace/client/common/logic_classes.mjs';
import * as logic from "./client/common/logic_classes.mjs";
import * as db from "./db.mjs";
import * as mdb from "./mdb.mjs";

import fs from "fs";
import https from "https";
import http from "http";
import path from "path";

import socketio from "socket.io";
import express from "express";
import cookie_parser from "cookie-parser";

let router = express();
let server = fs.existsSync("devenviro")
  ? http.createServer(router)
  : https.createServer(
      {
        key: fs.readFileSync("server.key"),
        cert: fs.readFileSync("server.cert")
      },
      router
    );
let io = socketio.listen(server);
io.set("log level", 2);

router.use(cookie_parser());
router.get(function(req, res, next) {
  console.log("^^^^^^^^");
  let user = req.cookies.gs3user;
  console.log(req.cookies.gs3user);
  if (user === "papo") {
  }
  next();
});

router.use(express.static(path.resolve(path.resolve(), "client")));

let categories = [];
let categories_names = [
  "Super",
  "Farmacia",
  "Educación",
  "Extra-curricular",
  "Esparcimiento",
  "Gastos Casa",
  "Comida Afuera"
];
for (let categorie of categories_names) {
  categories.push(new logic.Category(categorie));
}

let buyers = [];
let buyers_names = ["Julieta", "Papo"];
for (let buyer of buyers_names) {
  buyers.push(new logic.Buyer(buyer));
}

let pay_methods = [];
let pay_methods_names = [
  "Efectivo",
  "Comafi Crédito",
  "Comafi Débito",
  "Galicia Visa Crédito",
  "Galicia Visa Débito",
  "Galicia Máster Crédito",
  "Galicia Máster Débito",
  "Santander Crédito",
  "Santander Débito",
  "Nación Débito"
];

for (let pay_method of pay_methods_names) {
  pay_methods.push(new logic.PayMethod(pay_method));
}

var expenditures = [];

console.log("--gs3--");

var messages = [];
var sockets = [];

io.on("connection", function(socket) {
  // messages.forEach(function(data) {
  //     socket.emit('message', data);
  // });

  sockets.push(socket);

  socket.on("validate_user", function(user) {
    if (user === "papo") {
      init(socket, user);
    } else {
      console.log("user_wrong");
      socket.emit("user_wrong");
    }
  });

  socket.on("disconnect", function() {
    sockets.splice(sockets.indexOf(socket), 1);
  });

  socket.on("go", function(username) {
    remote_log("going");
    if (username == "papo") {
      init(socket, username);
    } else {
      remote_log("wrong username");
    }
  });

  socket.on("update_categories", function() {
    remote_log("sending categories");
    socket.emit("update_categories", categories);
  });

  socket.on("new_category", function(category) {
    categories.push(category);
    broadcast("update_categories", categories);
  });

  socket.on("add_expenditure", function(expenditure) {
    // console.log("Adding", expenditure)
    // console.log("To", expenditures)
    let new_expenditure = new logic.Expenditure(expenditure);
    expenditures.push(new_expenditure);
    // console.log("Resulting in", expenditures)
    upsert_expenditure(new_expenditure);
  });

  socket.on("edit_expenditure", function(expenditure) {
    let edit_expenditure_idx = expenditures.findIndex(
      item => item.uid === expenditure.uid
    );
    let edit_expenditure = new logic.Expenditure(expenditure);
    expenditures[edit_expenditure_idx] = edit_expenditure;
    upsert_expenditure(expenditure);
  });

  socket.on("delete_expenditure", function(expenditure_uid) {
    // console.log("Deleting", expenditure_uid)
    // console.log("From", expenditures)
    let idx = expenditures.findIndex(
      expenditure => expenditure.uid === expenditure_uid
    );
    if (idx > -1) {
      expenditures.splice(idx, 1);
    } else {
      remote_log("Error trying to delete expenditure.");
      // console.log("error deleting", expenditure_uid)
    }
    delete_expenditure(expenditure_uid);
  });

  socket.on("delete_category", function(category) {
    remove_from_list(categories, category);
    broadcast("update_categories", categories);
  });

  socket.on("backlog", function(msg) {
    remote_log(msg);
  });

  socket.on("load_expenditures", function() {
    mdb.load_expenditures((err, data) => {
      if (err) {
        remote_log("Error loading expenditures data.");
      } else {
        expenditures = data;
        socket.emit("update_expenditures", expenditures);
      }
    });
  });

  socket.on("load_selectable", function(selectable_type) {
    let update_message = "update_" + selectable_type;
    mdb.load_records(selectable_type, (err, data) => {
      if (err) {
        remote_log("Error loading " + selectable_type + " data.");
      } else {
        console.log(update_message)
        socket.emit(update_message, data);
      }
    });
  });

  function remote_log(text) {
    socket.emit("remote_log", text);
  }
});

function remote_log(socket, text) {
  socket.emit("remote_log", text);
}

function init(socket, username) {
  db.load_init_file((err, file_data) => {
    if (err) {
      remote_log(socket, "Error loading init data.");
    } else {
      let init_data = JSON.parse(file_data);
      console.log(Object.keys(init_data));
      // revisar si esta bien escrito por el tema del for y el callback
      for (let selectable of Object.keys(init_data)) {
        mdb.exists(selectable, (err, res) => {
          if (err) {
            remote_log(socket, "Error retriving database status.");
          } else {
            if (res) {
              update_selectable(selectable);
            } else {
              console.log(selectable, "not in database");
              mdb.save_records(init_data[selectable].data, selectable, err => {
                if (err) {
                  console.log(
                    "Error initalizating " + selectable + " database",
                    err
                  );
                } else {
                  console.log(selectable + " database initialized");
                }
              });
            }
          }
        });
      }
      socket.emit("init", init_data);
    }
    mdb.load_expenditures((err, data) => {
      if (err) {
        remote_log(socket, "Error loading expenditures data.");
      } else {
        expenditures = data;
        socket.emit("update_expenditures", expenditures);
      }
    });
  });
}

function update_selectable(selectable) {
  console.log("updating", selectable);
}

function upsert_expenditure(expenditure) {
  mdb.upsert_expenditure(expenditure, err => {
    if (err) {
      console.log("Error upserting expenditure file.", err);
    } else {
      broadcast("update_expenditures", expenditures);
    }
  });
}

function delete_expenditure(expenditure_uid) {
  console.log("Deleting");
  mdb.delete_expenditure(expenditure_uid, err => {
    if (err) {
      console.log("Error deleting expenditure.", err);
    } else {
      broadcast("update_expenditures", expenditures);
      // console.log("broadcasting", expenditures);
    }
  });
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
  } else {
    console.log("ERROR: Element not found in index.");
  }
}

server.listen(
  process.env.PORT || 3000,
  process.env.IP || "0.0.0.0",
  function() {
    var addr = server.address();
    console.log("gs3 server listening at", addr.address + ":" + addr.port);
  }
);
