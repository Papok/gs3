/* global io */
/* global $ */
import * as html from "./html_classes.js";
import * as gs_html from "./gs_html_classes.js";
import * as logic from "../../../common/logic_classes.mjs";
import * as csv from "./csv.js";
import { delete_cookie, camel2snake } from "./misc.js";
import * as log from "./logger.js";
import { pre_init_data } from "./pre_init_data.js";

var client = {};

log.info("Running.");
var socket = io.connect();

client.socket = socket;
client.events = new Map();
client.on = function(event, f) {
  this.events.set(event, f);
};
client.emit = function(event, payload) {
  console.log(event);
  this.events.get(event)(payload);
};

html.init_html_classes(client);
gs_html.init(client);

// let categories = [new logic.Category("Loading...", 0)];
// let buyers = [new logic.Buyer("Loading...", 0)];
// let pay_methods = [new logic.PayMethod("Loading...", 0)];

let expenditures = [];
let selectables = new logic.Selectables(
  parse_selectables_server_data(pre_init_data)
);

let settings_pane = new gs_html.edit_selectables_pane("edit_pane", selectables);
let new_transaction_form = new gs_html.expenditure_input_form(
  "input_expenditure",
  selectables
);
let selectable_edit_form;
let list = new html.active_html_base("expenditures_list");
let login_box = new gs_html.login_form("login_box");

new_transaction_form.hide()
new_transaction_form.draw()
new_transaction_form.link_handlers()

// new gs_html.expenditure_input_form("input_expenditure", selectables);

$(document).ready(function() {
  console.log("ready");
  test();
});

function find_index_by_attr_in_array(array, search_attr, search_value) {
  return array.findIndex(item => item[search_attr] == search_value);
}

function get_attr_by_attr_in_array(array, search_attr, search_value, ret_attr) {
  return array[array.findIndex(item => item[search_attr] == search_value)][
    ret_attr
  ];
}

function remove_from_list(list, element) {
  var index = list.indexOf(element);
  if (index > -1) {
    list.splice(index, 1);
  } else {
    console.log("ERROR: Element not found in index.");
  }
}

function deserialize_into(s_array, data_class) {
  let r_array = [];
  for (let item of s_array) {
    r_array.push(
      new logic[data_class](item._label, item._uid, item._color, item._uid)
    );
  }
  return r_array;
}

function login_control(login_box) {
  console.log("login_control");
  let allcoockies = document.cookie;
  console.log(allcoockies);
  let coockiearray = allcoockies.split(";");
  let coockie_found = false;
  for (let coockie of coockiearray) {
    let name = coockie.split("=")[0].trim();
    let value = coockie.split("=")[1].trim();
    console.log(coockie);
    if (name === "gs3user") {
      coockie_found = true;
      console.log("found", value);
      socket.emit("validate_user", value);
      break;
    }
  }
  if (!coockie_found) {
    login_box.draw();
    login_box.link_handlers();
  }
}

function parse_selectables_server_data(selectable_data) {
  let selectables = {};
  for (let selectable of Object.keys(selectable_data)) {
    selectables[selectable] = {
      type: selectable,
      logic_class: selectable_data[selectable].logic_class,
      label: selectable_data[selectable].label,
      items: deserialize_into(
        selectable_data[selectable].data,
        selectable_data[selectable].logic_class
      )
    };
  }
  return selectables;
}

function create_selectables_socket_listeners() {
  log.log("creating listeners");
  for (let selectable_type of Object.keys(selectables)) {
    let update_message = "update_" + selectable_type;
    console.log(update_message);
    socket.on(update_message, function(items) {
      console.log("updating", selectable_type, items.length);
      update_selectable(selectable_type, items);
    });
  }
}

function update_selectable(selectable_type, items) {
  log.debug("update_selectable", selectable_type, items);
  selectables[selectable_type].items = items;
  settings_pane.redraw();
  settings_pane.link_handlers();
}

function update_selectables(selectables_data) {
  selectables.update(
    parse_selectables_server_data(selectables_data)
  );

  ///expenditure_input_form tiene que ser updateable (tembien selectables ↑↑↑↑↑), y cuando se updatea selectables, se updatean automaticamente sus dependientes
  settings_pane.update(selectables);
  // new_transaction_form = new gs_html.expenditure_input_form(
  //   "input_expenditure",
  //   selectables
  // );
  new_transaction_form.update(selectables)
    ///
 
}

function update_selectables_styles(categories_items) {
  let styles = gs_html.get_styles(categories_items);
  $("style").html(styles);
}

function update_expenditures(recived_expenditures = expenditures) {
  expenditures = [];
  for (var i = 0; i < recived_expenditures.length; ++i) {
    expenditures[i] = new logic.Expenditure(recived_expenditures[i]);
  }
  list = new gs_html.expenditure_list(
    "expenditures_list",
    expenditures,
    selectables
  );

  list.draw();
  list.link_handlers();
}

function send(msg) {
  console.log("Sending message:", msg);
  socket.emit("message", msg);
}

//
// server messages listeners
//

socket.on("connect", function() {
  console.log("Socket connected");
  socket.emit("backlog", "connected");
});

socket.on("remote_log", function(text) {
  console.log("Server says:", text);
});

socket.on("remote_error", function(text) {
  alert("Server error:\n" + text);
});

socket.on("user_wrong", function() {
  console.log("user_wrong");
  if (login_box.drawn) {
    login_box.unhide();
  } else {
    delete_cookie("gs3user");
    login_control(login_box);
  }
});

socket.on("missing_selectables_database", function(msg) {
  let ok = confirm(
    "Error with selectables database:\n" +
      msg +
      "\nThe database will be rebuilt."
  );
  if (ok) {
    socket.emit("initialize_selectables_database");
  }
});

socket.on("update_selectables", function(selectables_data) {
  update_selectables(selectables_data);
  // log.log("update_selectables", selectables_data);
  // selectables = new logic.Selectables(
  //   parse_selectables_server_data(selectables_data)
  // );
});

socket.on("update_categories", function(recived_categories) {
  console.log("reciving categories");
  categories = recived_categories;
});

socket.on("update_expenditures", function(recived_expenditures) {
  update_expenditures(recived_expenditures);
});

///////// candidates to erase
socket.on("update_categories", function(recived_categories) {
  console.log("reciving categories");
  categories = recived_categories;
});

socket.on("new_category", function(category) {
  categories.push(category);
});
/////////

//
//
//

///
/// local messages listeners
///

client.on("logout", function() {
  delete_cookie("gs3user");
  list.remove();
  login_control(login_box);
});

client.on("download_data", function() {
  console.log("downlowad_data");
  let table = new csv.Table(expenditures, selectables);
  let table_string = table.table_string;
  let csvContent = "data:text/csv;charset=utf-8," + table_string;
  let encoded_uri = encodeURI(csvContent);
  window.open(encoded_uri);
});

client.on("settings", function() {
  console.log("settings");
  list.hide();
  new_transaction_form.hide();
  settings_pane.draw();
  settings_pane.link_handlers();
  settings_pane.unhide();
});

client.on("list_mode", function() {
  new_transaction_form.hide();
  settings_pane.hide();
  socket.emit("load_expenditures");
  list.unhide();
  list.link_handlers();
});

client.on("add_mode", function() {
  list.hide();
  settings_pane.hide();
  new_transaction_form.set_add_mode();
  new_transaction_form.draw();
  new_transaction_form.link_handlers();
  new_transaction_form.unhide();
});

client.on("edit_mode", function(fill_expenditure) {
  new_transaction_form.set_edit_mode(fill_expenditure);
  new_transaction_form.unhide();
  new_transaction_form.link_handlers();
  list.hide();
});

client.on("add_expenditure", function(expenditure) {
  expenditures.push(expenditure); //.expenditure;
  socket.emit("add_expenditure", expenditure);
  update_expenditures(expenditures);
});

client.on("delete_expenditure", function(expenditure) {
  remove_from_list(expenditures, expenditure);
  socket.emit("delete_expenditure", expenditure.uid);
  update_expenditures(expenditures);
});

client.on("edit_expenditure", function(expenditure) {
  let edit_expenditure_idx = expenditures.findIndex(
    item => item.uid === expenditure.uid
  );
  expenditures[edit_expenditure_idx] = expenditure;
  socket.emit("edit_expenditure", expenditure);
  update_expenditures(expenditures);
});

function test() {
  create_selectables_socket_listeners();

  socket.on("init", function(data) {
    log.log("Init recived.");
    login_box.remove();

    // update_selectables_styles(selectables.categories.items);

    // new_transaction_form = new gs_html.expenditure_input_form(
    //   "input_expenditure",
    //   selectables
    // );

    // settings_pane = new gs_html.edit_selectables_pane("edit_pane", selectables);
  });

  //
  // The folowing loop defines listeners for entering list, edit and add mode for the selectables.
  //

  for (let selectable of Object.entries(selectables)) {
    let selectable_type = selectable[1].type.toLowerCase();
    let list_mode_message = "list_" + selectable_type + "_mode";
    let edit_mode_message = "edit_" + selectable_type + "_mode";
    let add_mode_message = "add_" + selectable_type + "_mode";

    client.on(list_mode_message, function() {
      console.log(list_mode_message);
      if (!(settings_pane instanceof gs_html.edit_selectables_pane)) {
        settings_pane = new gs_html.edit_selectables_pane(
          "edit_pane",
          selectables
        );
      } else {
        settings_pane.update(selectables);
      }
      settings_pane.draw();
      settings_pane.link_handlers();
    });

    client.on(edit_mode_message, function(fill_category) {
      console.log(edit_mode_message);
      selectable_edit_form = new gs_html.selectable_form(
        "edit_pane",
        selectable_type
      );
      selectable_edit_form.draw();
      selectable_edit_form.set_edit_mode(fill_category);
      selectable_edit_form.link_handlers();
    });

    client.on(add_mode_message, function() {
      console.log(add_mode_message);
      selectable_edit_form = new gs_html.selectable_form(
        "edit_pane",
        selectable_type
      );
      selectable_edit_form.draw();
      selectable_edit_form.set_add_mode();
      selectable_edit_form.link_handlers();
    });
  }

  //
  // The folowing loop defines listeners for adding, deleting and editing selectables.
  //

  for (let selectable of Object.entries(selectables)) {
    let selectable_data = selectable[1];
    let selectable_type = selectable_data.type.toLowerCase();
    let selectable_logic_class = selectable_data.logic_class;
    let add_item_message = "add_" + selectable_type;
    let delete_item_message = "delete_" + selectable_type;
    let edit_item_message = "edit_" + selectable_type;

    console.log(add_item_message, delete_item_message, edit_item_message);

    console.log(selectable_logic_class);

    client.on(add_item_message, function(item) {
      console.log(add_item_message);
      let new_item = new logic[selectable_logic_class](
        item._label,
        item._uid,
        item._color,
        item._uid
      );
      selectable_data.items.push(new_item);
      socket.emit("add_selectable", { selectable_data, item });

      //update_categories(categories)
    });

    client.on(delete_item_message, function(item) {
      console.log(delete_item_message);
      console.log(selectable_data.items); /// parece que esto no funciona. funcionaría si selectable_data se evalua al nomento de registrar la funcion, pero entonces no se actalizaria...

      let idx = find_index_by_attr_in_array(
        expenditures,
        selectable_type,
        item._uid
      );
      if (idx === -1) {
        remove_from_list(selectable_data.items, item);

        //socket.emit("delete_category", category);
        //update_categories(categories)

        client.emit("list_" + selectable_type + "_mode");
      } else {
        window.alert("The category cannot be deleted because is being used.");
      }
    });

    client.on(edit_item_message, function(item) {
      let edit_item_idx = selectable_data.items.findIndex(
        _item => _item._uid === item._uid
      );
      let edited_item = new logic[selectable_logic_class](
        item._label,
        item._uid,
        item._color,
        item._uid
      );
      selectable_data.items[edit_item_idx] = edited_item;

      //socket.emit("edit_category", category);
      //update_categories(categories):
    });
  }
  login_control(login_box);
}

//
// Server signals listeners
//
