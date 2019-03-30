/* global io */
/* global $ */
import * as html from "./html_classes.js";
import * as gs_html from "./gs_html_classes.js";
import * as logic from "../../../common/logic_classes.mjs";
import * as csv from "./csv.js";
import { delete_cookie, camel2snake } from "./misc.js";
import * as log from "./logger.js";

var global = {};

log.info("Running.");
var socket = io.connect();

global.socket = socket;
global.events = new Map();
global.on = function(event, f) {
  this.events.set(event, f);
};
global.emit = function(event, payload) {
  this.events.get(event)(payload);
};

html.init_html_classes(global);
gs_html.init(global);

var categories = [new logic.Category("Loading...", 0)];
var buyers = [new logic.Buyer("Loading...", 0)];
var pay_methods = [new logic.PayMethod("Loading...", 0)];

let selectable_items = { categories, buyers, pay_methods };
let selectables = {};
let selectables2;

var expenditures = [];

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

function test() {
  let new_transaction_form;
  let settings_pane;
  let selectable_edit_form;
  let list = new html.active_html_base("expenditures_list");
  let login_box = new gs_html.login_form("login_box");
  login_control(login_box);

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

  socket.on("init", function(data) {
    log.log("Init recived.");
    login_box.remove();
    let init_data = data;

    function deserialize_into(s_array, data_class) {
      let r_array = [];
      for (let item of s_array) {
        r_array.push(
          new logic[data_class](item._label, item._uid, item._color, item._uid)
        );
      }
      return r_array;
    }

    for (let selectable of Object.keys(selectable_items)) {
      selectable_items[selectable] = deserialize_into(
        init_data[selectable].data,
        init_data[selectable].logic_class
      );
      selectables[selectable] = {
        type: selectable,
        logic_class: init_data[selectable].logic_class,
        label: init_data[selectable].label,
        items: selectable_items[selectable]
      };
    }

    selectables2 = new logic.Selectables(selectables);

    create_selectables_socket_listeners();

    for (let selectable of Object.keys(selectable_items)) {
      socket.emit("load_selectable", selectable);
    }

    let styles = gs_html.get_styles(selectable_items.categories);
    $("style").html(styles);

    new_transaction_form = new gs_html.expenditure_input_form(
      "input_expenditure",
      selectable_items
    );

    //settings_pane = new gs_html.edit_categories_pane(
    settings_pane = new gs_html.edit_selectables_pane("edit_pane", selectables);
    // new_transaction_form.draw();
    // new_transaction_form.link_handlers();

    global.on("logout", function() {
      delete_cookie("gs3user");
      list.remove();
      login_control(login_box);
    });

    global.on("download_data", function() {
      console.log("downlowad_data");
      let table = new csv.Table(expenditures, selectables2);
      let table_string = table.table_string;
      let csvContent = "data:text/csv;charset=utf-8," + table_string;
      let encoded_uri = encodeURI(csvContent);
      window.open(encoded_uri);
    });

    global.on("settings", function() {
      console.log("settings");
      list.hide();
      new_transaction_form.hide();
      settings_pane.draw();
      settings_pane.link_handlers();
      settings_pane.unhide();
    });

    global.on("list_mode", function() {
      new_transaction_form.hide();
      settings_pane.hide();
      socket.emit("load_expenditures");
      list.unhide();
      list.link_handlers();
    });

    global.on("add_mode", function() {
      list.hide();
      settings_pane.hide();
      new_transaction_form.set_add_mode();
      new_transaction_form.draw();
      new_transaction_form.link_handlers();
      new_transaction_form.unhide();
    });

    //
    // The folowing loop defines listeners for entering list, edit and add mode for the selectables.
    //

    for (let selectable of Object.entries(selectables)) {
      let selectable_type = selectable[1].type.toLowerCase();
      let list_mode_message = "list_" + selectable_type + "_mode";
      let edit_mode_message = "edit_" + selectable_type + "_mode";
      let add_mode_message = "add_" + selectable_type + "_mode";

      global.on(list_mode_message, function() {
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

      global.on(edit_mode_message, function(fill_category) {
        console.log(edit_mode_message);
        selectable_edit_form = new gs_html.selectable_form(
          "edit_pane",
          selectable_type
        );
        selectable_edit_form.draw();
        selectable_edit_form.set_edit_mode(fill_category);
        selectable_edit_form.link_handlers();
      });

      global.on(add_mode_message, function() {
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

    global.on("edit_mode", function(fill_expenditure) {
      new_transaction_form.set_edit_mode(fill_expenditure);
      new_transaction_form.unhide();
      new_transaction_form.link_handlers();
      list.hide();
    });

    global.on("add_expenditure", function(expenditure) {
      expenditures.push(expenditure); //.expenditure;
      socket.emit("add_expenditure", expenditure);
      update_expenditures(expenditures);
    });

    global.on("delete_expenditure", function(expenditure) {
      remove_from_list(expenditures, expenditure);
      socket.emit("delete_expenditure", expenditure.uid);
      update_expenditures(expenditures);
    });

    global.on("edit_expenditure", function(expenditure) {
      let edit_expenditure_idx = expenditures.findIndex(
        item => item.uid === expenditure.uid
      );
      expenditures[edit_expenditure_idx] = expenditure;
      socket.emit("edit_expenditure", expenditure);
      update_expenditures(expenditures);
    });

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

      global.on(add_item_message, function(item) {
        console.log(add_item_message);
        selectable_data.items.push(
          new logic[selectable_logic_class](
            item._label,
            item._uid,
            item._color,
            item._uid
          )
        );
        // socket.emit("add_category", category)

        //update_categories(categories)
      });

      global.on(delete_item_message, function(item) {
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

          global.emit("list_" + selectable_type + "_mode");
        } else {
          window.alert("The category cannot be deleted because is being used.");
        }
      });

      global.on(edit_item_message, function(item) {
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
  });

  socket.on("update_categories", function(recived_categories) {
    console.log("reciving categories");
    categories = recived_categories;
  });

  socket.on("update_expenditures", function(recived_expenditures) {
    update_expenditures(recived_expenditures);
  });

  //
  //
  // esto no funciona porque el objeto 'selectables' todavía esta vacio
  function create_selectables_socket_listeners() {
    for (let selectable_type of Object.keys(selectables2)) {
      let update_message = "update_" + selectable_type;
      console.log(update_message);
      socket.on(update_message, function(data) {
        console.log("updating", selectable_type, data.length);
        selectables2[selectable_type].data = data;
      });
    }
  }

  socket.on("new_category", function(category) {
    categories.push(category);
  });

  function send(msg) {
    console.log("Sending message:", msg);
    socket.emit("message", msg);
  }

  socket.on("connect", function() {
    console.log("Socket connected");
    socket.emit("backlog", "connected");
  });

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
}
