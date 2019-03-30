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

server.listen(
  process.env.PORT || 3000,
  process.env.IP || "0.0.0.0",
  function() {
    var addr = server.address();
    console.log("gs3 server listening at", addr.address + ":" + addr.port);
  }
);

io.on("connection", function(socket) {
  let user;
  sockets.push(socket);

  socket.on("validate_user", function(username) {
    user = username;
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
    user = username;
    remote_log("going");
    if (username == "papo") {
      init(socket, user);
    } else {
      remote_log("wrong username");
    }
  });

  socket.on("initialize_selectables_database", function() {
    initialize_selectables_database(socket);
    // hay que pasar esto a promize porque la llamada a init está quedando adentro de initialize_selectables_database() y
    // esto es medio desprolijo.
    // la otra posibilidad es avisarle al cliente que la base de datos esta inicializada y que que el cliente pida un init...
    // me parece mejor las promise. no tiene porque intervenir el cliente en este proceso
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
    let new_expenditure = new logic.Expenditure(expenditure);
    expenditures.push(new_expenditure);
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
    let idx = expenditures.findIndex(
      expenditure => expenditure.uid === expenditure_uid
    );
    if (idx > -1) {
      expenditures.splice(idx, 1);
    } else {
      remote_log("Error trying to delete expenditure.");
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
    client_update_expenditures(socket);
  });

  socket.on("load_selectable", function(selectable_type) {
    let update_message = "update_" + selectable_type;
    mdb.load_records(selectable_type, (err, data) => {
      if (err) {
        remote_log("Error loading " + selectable_type + " data.");
      } else {
        console.log(update_message);
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

function remote_error(socket, text) {
  socket.emit("remote_error", text);
}

const load_records = type => {
  return new Promise((resolve, reject) => {
    mdb.exists(type, (err, res) => {
      if (err) {
        reject("Error retriving database status. (" + type + ")");
      } else {
        if (res) {
          mdb.load_records(type, (err, docs) => {
            if (err) {
              reject("Error retriving database data. (" + type + ")");
            } else {
              resolve({ type: type, data: docs });
            }
          });
        } else {
          reject("Database does not exist. (" + type + ")");
        }
      }
    });
  });
};

function init(socket, username) {
  console.log("init");
  let init_data = {};
  db.load_selectable_types((err, file_data) => {
    if (err) {
      remote_log(socket, "Error loading selectable_types data.");
    } else {
      let selectable_types_data = JSON.parse(file_data);
      let selectable_types = Object.keys(selectable_types_data);
      let jobs = [];
      for (let selectable_type of selectable_types) {
        jobs.push(load_records(selectable_type));
      }
      console.log(jobs);
      Promise.all(jobs).then(
        function(results) {
          for (let result of results) {
            init_data[result.type] = {};
            init_data[result.type].data = result.data;
            init_data[result.type].logic_class =
              selectable_types_data[result.type].logic_class;
            init_data[result.type].label =
              selectable_types_data[result.type].label;
          }
          console.log("success", init_data);
          socket.emit("init", init_data);
          client_update_expenditures(socket);
        },
        err => {
          console.log("error:" + err);
          socket.emit("missing_selectables_database", err);
        }
      );
    }
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

function initialize_selectables_database(socket) {
  db.load_init_file((err, file_data) => {
    if (err) {
      return false;
    } else {
      let init_data = JSON.parse(file_data);
      console.log(Object.keys(init_data));
      // revisar si esta bien escrito por el tema del for y el callback
      for (let selectable of Object.keys(init_data)) {
        mdb.save_records(init_data[selectable].data, selectable, err => {
          if (err) {
            console.log(err);
            remote_error(err);
          } else {
            init(socket);
          }
        });
      }
    }
  });
}

function client_update_expenditures(socket) {
  mdb.load_expenditures((err, data) => {
    if (err) {
      remote_log(socket, "Error loading expenditures data.");
    } else {
      expenditures = data;
      socket.emit("update_expenditures", expenditures);
    }
  });
}
