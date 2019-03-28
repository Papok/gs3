/* global $ */

import * as html from "./html_classes.js";
import * as logic from "../../../common/logic_classes.mjs";
import {hsl2rgb, camel2snake} from "./misc.js";
//import colorpicker from "./colorpicker.js"
let colorpicker = html.colorpicker;

var socket = undefined;
var environment = undefined;

function init(env) {
  environment = env;
  socket = env.socket;
}


function get_attr_by_attr_in_array(array, search_attr, search_value, ret_attr) {
  let item = array[array.findIndex(item => item[search_attr] == search_value)];
  if (item === undefined) {
    console.error(
      "Element not found in array. The database seems to be corrupted."
    );
    return undefined;
  } else {
    return array[array.findIndex(item => item[search_attr] == search_value)][
      ret_attr
    ];
  }
}

function str_pad(n) {
  return String("00" + n).slice(-2);
}

function remove_from_list(list, element) {
  var index = list.indexOf(element);
  if (index > -1) {
    list.splice(index, 1);
  } else {
    console.log("ERROR: Element not found in index.");
  }
}

function get_styles(categories) {
  let open_xs = "@media (max-width: 575px) {";
  let open_sm = "@media (min-width: 576px) and (max-width: 767px){";
  let open_md = "@media (min-width: 768px) and (max-width: 991px){";
  let open_lg = "@media (min-width: 992px) and (max-width: 1199px){";
  let open_xl = "@media (min-width: 1200px) {";

  let styles = open_xs;
  for (let category of categories) {
    let color = category.color;
    let uid = category.uid;
    let style = ` .cl${uid} { background: ${color}; overflow: hidden; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block}`;
    // let style = `div { background: ${color};}`
    styles += style;
  }
  styles += "}";

  return styles;
}

class login_form extends html.bs_form {
  constructor(parent) {
    //////////////////////////////
    //socket.emit('go', 'papo')
    //////////////////////////////

    //
    // Username
    //

    let username_label = "Username";
    let username_input = new html.text_input(
      "autoparent",
      new Map([
        ["class", "form-control"],
        ["autocorrect", "off"],
        ["autocapitalize", "none"],
        ["autofocus", "true"],
        ["tabindex", "1"]
      ])
    );
    let username_form = new html.bs_form_group(
      "autoparent",
      username_label,
      username_input,
      new Map([["class", "col-12"]])
    );

    //
    // Password
    //

    let password_label = "Password";
    let password_input = new html.password_input(
      "autoparent",
      new Map([["class", "form-control"], ["tabindex", "2"]])
    );
    let password_form = new html.bs_form_group(
      "autoparent",
      password_label,
      password_input,
      new Map([["class", "col-12"]])
    );

    //
    // Buttons
    //
    let login_button = new html.submit_input(
      "autoparent",
      "Login",
      new Map([["class", "btn btn-dark col-12"]])
    );

    let form_fields = {
      username: username_form,
      password: password_form
      //login: login_button
    };

    let form_buttons = {
      login: login_button
    };

    let fields_div = new html.div(
      "autoparent",
      [username_form, password_form],
      new Map([["class", "col-12 col-sm-4 offset-sm-4"]])
    );

    let buttons_div = new html.div(
      "autoparent",
      [login_button],
      new Map([["class", "col-12 col-sm-4 offset-sm-4"]])
    );

    super(
      parent,
      [fields_div, buttons_div],
      form_fields,
      form_buttons,
      new Map([["class", "form-row"]])
    );
    this.set_handler("submit", event => {
      console.log("submit");
      let username = this.fields.username.control.value;
      document.cookie = "gs3user = " + username;
      socket.emit("validate_user", username);
      event.preventDefault();
    });
  }

  draw() {
    super.draw();
    console.log("altdraw");
    // let id = this.fields.username.control.id
    // let selector = this.fields.username.control.selector
    // let element = document.getElementById(id)
    // console.log(element)
    // setTimeout(function() {
    //     $(selector).on('touchstart', function() {
    //         $(selector).focus()
    //     })
    // }, 10);
    // setTimeout(function() {
    //     $(selector).click();
    // }, 1000)
    // setTimeout(function() {
    //     $(selector).trigger('touchstart');
    // }, 1000)
  }
}

class form_fields extends html.div {
  constructor(parent, fields, extra_attributes) {
    super(parent, fields, extra_attributes);
    this.reference = fields.reference;
  }

  get_values() {
    let ret = {};
    console.log("get_values↓↓↓↓")
    console.log(this.reference)
    for (let [field, control] of Object.entries(this.reference)) {
      console.log(field)
      console.log(control)
      if (control.value !== undefined) {
        ret[field] = control.value;
      }
    }
    return ret;
  }
}

class add_edit_buttons extends html.div {
  constructor(parent, fields, data_type) {
    let add_button = new html.button(
      "autoparent",
      "Add",
      new Map([["type", "button"], ["class", "btn btn-success col-12"]])
    );
    let save_button = new html.button(
      "autoparent",
      "Save",
      new Map([["type", "button"], ["class", "btn btn-success col-12"]])
    );
    let reset_button = new html.button(
      "autoparent",
      "Reset",
      new Map([["type", "button"], ["class", "btn btn-danger col-6"]])
    );

    let delete_button = new html.button(
      "autoparent",
      "Delete",
      new Map([["type", "button"], ["class", "btn btn-danger col-6"]])
    );
    let cancel_button = new html.button(
      "autoparent",
      "Cancel",
      new Map([["type", "button"], ["class", "btn btn-secondary col-6"]])
    );

    super(
      parent,
      [add_button, save_button, reset_button, delete_button, cancel_button],
      new Map([["class", "form-row col-12 col-md-2"]])
    );

    this.reference = {
      add_button: add_button,
      save_button: save_button,
      reset_button: reset_button,
      delete_button: delete_button,
      cancel_button: cancel_button
    };

    let add_mode_message = `add_${data_type}_mode`;
    let list_mode_message = `list_${data_type}_mode`;
    let add_message = `add_${data_type}`;
    let edit_message = `edit_${data_type}`;
    let delete_message = `delete_${data_type}`;

    reset_button.set_handler("click", () => {
      environment.emit(add_mode_message);
    });

    add_button.set_handler("click", () => {
      environment.emit(add_message, fields.get_values());
      environment.emit(list_mode_message);
    });

    save_button.set_handler("click", () => {
      let edit_category = fields.get_values();
      console.log(edit_category)
      edit_category._uid = fields.fill_data._uid;

      environment.emit(edit_message, edit_category);
      environment.emit(list_mode_message);
    });

    delete_button.set_handler("click", () => {
      delete_button.blur();
      if (confirm("Do you want to delete this line?")) {
        environment.emit(delete_message, fields.fill_data);
      }
    });

    cancel_button.set_handler("click", () => {
      environment.emit(list_mode_message);
    });
  }
  set_edit_mode() {
    this.reference.add_button.hide();
    this.reference.reset_button.hide();
    this.reference.cancel_button.unhide();
    this.reference.delete_button.unhide();
    this.reference.save_button.unhide();
  }

  set_add_mode() {
    this.reference.add_button.unhide();
    this.reference.reset_button.unhide();
    this.reference.cancel_button.unhide();
    this.reference.delete_button.hide();
    this.reference.save_button.hide();
  }
}

class category_form_fieds extends form_fields {
  constructor(parent, fill_data) {
    let name_label = "Category name";
    let name_input = new html.text_input(
      "autoparent",
      new Map([["class", "form-control"]])
    );
    let name_form = new html.bs_form_group(
      "autoparent",
      name_label,
      name_input,
      new Map([["class", "col-7, col-md-3"]])
    );
    let color_label = "Color";
    let color_input = new colorpicker("autoparent");
    let color_form = new html.bs_form_group(
      "autocapitalize",
      color_label,
      color_input,
      new Map([["class", "col-1, col-md-1"]])
    );
    super(
      "autoparent",
      [name_form, color_form],
      new Map([["class", "form-row col-12 col-md-10"]])
    );

    this.reference = {
      _label: name_form
    };
    this.fill_data = fill_data;
  }
}

class category_form extends html.form {
  constructor(parent, fill_data) {
    let form_fields = new category_form_fieds("autoparent", fill_data);
    let form_buttons = new add_edit_buttons(
      "autoparent",
      form_fields,
      "category"
    );
    super(
      parent,
      [form_fields, form_buttons],
      form_fields,
      form_buttons,
      new Map([["class", "form-row"]])
    );
  }

  set_edit_mode(fill_data) {
    this.buttons.set_edit_mode();
    this.set_values(fill_data);
    this.fields.add_attr("data-category-uid", fill_data._uid);
    this.fields.fill_data = fill_data;
  }

  set_add_mode() {
    this.buttons.set_add_mode();
    this.add_attr("data-category-uid", 0);
  }
}

class selectable_form_fieds extends form_fields {
  constructor(parent, selectable_type, fill_data) {
    let capitalized_selectable_type =
      selectable_type.charAt(0).toUpperCase() +
      selectable_type.slice(1).toLowerCase();
    let name_label = capitalized_selectable_type + " name";
    let name_input = new html.text_input(
      "autoparent",
      new Map([["class", "form-control"]])
    );
    let name_form = new html.bs_form_group(
      "autoparent",
      name_label,
      name_input,
      new Map([["class", "col-7, col-md-3"]])
    );
    let color_label = "Color";
    let color_input = new colorpicker("autoparent");
    let color_form = new html.bs_form_group(
      "autocapitalize",
      color_label,
      color_input,
      new Map([["class", "col-1, col-md-1"]])
    );
    super(
      "autoparent",
      [name_form, color_form],
      new Map([["class", "form-row col-12 col-md-10"]])
    );

    this.reference = {
      _label: name_form,
      _color: color_form
    };
    this.fill_data = fill_data;
  }
}

class selectable_form extends html.form {
  constructor(parent, selectable_type, fill_data) {
    let form_fields = new selectable_form_fieds(
      "autoparent",
      selectable_type,
      fill_data
    );
    let form_buttons = new add_edit_buttons(
      "autoparent",
      form_fields,
      selectable_type
    );
    super(
      parent,
      [form_fields, form_buttons],
      form_fields,
      form_buttons,
      new Map([["class", "form-row"]])
    );
    

    this.uid_html_attribute = "data-" + selectable_type + "-uid";
    
    // this is to prevent from "submiting" the form when pressing "enter" on the only field of the form.
    this.set_handler("submit", function() {
      return false;
    });
  }

  set_edit_mode(fill_data) {
    this.buttons.set_edit_mode();
    this.set_values(fill_data);
    this.fields.add_attr(this.uid_html_attribute, fill_data._uid);
    this.fields.fill_data = fill_data;
  }

  set_add_mode() {
    this.buttons.set_add_mode();
    this.add_attr(this.uid_html_attribute, 0);
  }
}

class expenditure_input_form extends html.bs_form {
  constructor(parent, selectable_items, fill_expenditure) {
    // const form_mode = {
    //   ADD: Symbol("add"),
    //   EDIT: Symbol("edit")
    // };
    // Object.freeze(form_mode);
    // let mode = fill_expenditure === undefined ? form_mode.ADD : form_mode.EDIT;

    //
    // Date
    //

    let date_label = "Date";
    let date_input = new html.date_input(
      "autoparent",
      new Date(),
      new Map([["class", "form-control"]])
    );
    let date_form = new html.bs_form_group(
      "autoparent",
      date_label,
      date_input,
      new Map([["class", "col-7 col-md-3 order-md-1"]])
    );

    //
    // Buyer
    //
    let buyer_label = "Buyer";
    let buyer_select = new html.rich_select(
      "autoparent",
      selectable_items.buyers,
      undefined,
      new Map([["class", "form-control"]])
    );
    let buyer_form = new html.bs_form_group(
      "autoparent",
      buyer_label,
      buyer_select,
      new Map([["class", "col-5 col-md-2 order-md-2"]])
    );

    //
    // Category
    //
    let category_label = "Category";
    let category_select = new html.rich_select(
      "autoparent",
      selectable_items.categories,
      undefined,
      new Map([["class", "form-control"]])
    );
    let category_form = new html.bs_form_group(
      "autoparent",
      category_label,
      category_select,
      new Map([["class", "col-12 col-md-3 order-md-5"]])
    );

    //
    // Detail
    //
    let details_label = "Detail";
    let details_text_input = new html.text_input(
      "autoparent",
      new Map([["class", "form-control"]])
    );
    let details_form = new html.bs_form_group(
      "autoparent",
      details_label,
      details_text_input,
      new Map([["class", "col-8 col-md-9 order-md-6"]])
    );

    //
    // Amount
    //
    let amount_label = "Amount";
    let amount_text_input = new html.number_input(
      "autoparent",
      new Map([["class", "form-control"]])
    );
    let amount_form = new html.bs_form_group(
      "autoparent",
      amount_label,
      amount_text_input,
      new Map([["class", "col-4 col-md-2 order-md-4"]])
    );

    //
    // Pay Method
    //
    let pay_method_label = "Pay Method";
    let pay_method_select = new html.rich_select(
      "autoparent",
      selectable_items.pay_methods,
      undefined,
      new Map([["class", "form-control"]])
    );
    let pay_method_form = new html.bs_form_group(
      "autoparent",
      pay_method_label,
      pay_method_select,
      new Map([["class", "col-12 col-md-5 order-md-3"]])
    );

    //
    // Buttons
    //
    let add_button = new html.button(
      "autoparent",
      "Add",
      new Map([["type", "button"], ["class", "btn btn-success col-12"]])
    );
    let save_button = new html.button(
      "autoparent",
      "Save",
      new Map([["type", "button"], ["class", "btn btn-success col-12"]])
    );
    let reset_button = new html.button(
      "autoparent",
      "Reset",
      new Map([["type", "button"], ["class", "btn btn-danger col-6"]])
    );

    let delete_button = new html.button(
      "autoparent",
      "Delete",
      new Map([["type", "button"], ["class", "btn btn-danger col-6"]])
    );
    let cancel_button = new html.button(
      "autoparent",
      "Cancel",
      new Map([["type", "button"], ["class", "btn btn-secondary col-6"]])
    );

    let form_fields = {
      date: date_form,
      buyer: buyer_form,
      category: category_form,
      pay_method: pay_method_form,
      detail: details_form,
      amount: amount_form
    };

    let form_buttons = {
      add_button: add_button,
      save_button: save_button,
      reset_button: reset_button,
      delete_button: delete_button,
      cancel_button: cancel_button
    };

    let fields_div = new html.div(
      "autoparent",
      [
        date_form,
        buyer_form,
        category_form,
        pay_method_form,
        details_form,
        amount_form
      ],
      new Map([["class", "form-row col-12 col-md-10"]])
    );
    let buttons_div = new html.div(
      "autoparent",
      [add_button, save_button, reset_button, delete_button, cancel_button],
      new Map([["class", "form-row col-12 col-md-2"]])
    );

    super(
      parent,
      [fields_div, buttons_div],
      form_fields,
      form_buttons,
      new Map([["class", "form-row"]])
    );

    this.selectable_items = selectable_items;

    reset_button.set_handler("click", () => {
      environment.emit("add_mode");
    });

    add_button.set_handler("click", () => {
      environment.emit("add_expenditure", this.get_values());
      environment.emit("list_mode");
    });

    save_button.set_handler("click", () => {
      let edit_expenditure = this.get_values();
      edit_expenditure.uid = this.fill_expenditure.uid;
      environment.emit("edit_expenditure", edit_expenditure);
      environment.emit("list_mode");
    });

    delete_button.set_handler("click", () => {
      delete_button.blur();
      if (confirm("Do you want to delete this line?")) {
        environment.emit("delete_expenditure", this.fill_expenditure);
        environment.emit("list_mode");
      }
    });

    cancel_button.set_handler("click", () => {
      environment.emit("list_mode");
    });
  }

  update_options(selectable_items) {
    this.fields.buyer.control.update_options(selectable_items.buyers);
    this.fields.category.control.update_options(selectable_items.categories);
    this.fields.pay_method.control.update_options(selectable_items.pay_methods);
  }

  set_edit_mode(fill_expenditure) {
    this.fill_expenditure = fill_expenditure;
    this.set_values(fill_expenditure);
    this.add_attr("data-expenditure-uid", fill_expenditure.uid);
    this.buttons.add_button.hide();
    this.buttons.reset_button.hide();
    this.buttons.cancel_button.unhide();
    this.buttons.delete_button.unhide();
    this.buttons.save_button.unhide();
  }

  set_add_mode() {
    this.add_attr("data-expenditure-uid", 0);
    this.buttons.add_button.unhide();
    this.buttons.reset_button.unhide();
    this.buttons.cancel_button.unhide();
    this.buttons.delete_button.hide();
    this.buttons.save_button.hide();
    this.reset_fields();
  }

  reset_fields() {
    let date = new Date();
    let dd = str_pad(date.getDate());
    let mm = str_pad(date.getMonth() + 1); //January is 0!
    let yyyy = date.getFullYear();
    let date_string = yyyy + "-" + mm + "-" + dd;
    let reset_values = {
      date: date, //_string,
      buyer: this.selectable_items.buyers[0],
      category: this.selectable_items.categories[0],
      pay_method: this.selectable_items.categories[0],
      detail: "",
      amount: ""
    };
    this.set_values(reset_values);
  }

  // get_values() {
  //     let values = super.get_values();
  //     console.log(values)
  //     return values;
  // }
}

class expenditure_row extends html.bs_row {
  constructor(parent, expenditure, selectable_items) {
    let elements = [
      new Date(expenditure.date).toLocaleDateString(),
      get_attr_by_attr_in_array(
        selectable_items.buyers,
        "_value",
        expenditure.buyer,
        "_label"
      ),
      get_attr_by_attr_in_array(
        selectable_items.categories,
        "_value",
        expenditure.category,
        "_label"
      ),
      expenditure.detail,
      expenditure.amount,
      get_attr_by_attr_in_array(
        selectable_items.pay_methods,
        "_value",
        expenditure.pay_method,
        "_label"
      )
    ];
    let col_desc = [
      "col-3 col-md-2",
      "col-3 col-md-1",
      "col-6 col-md-2",
      "col-12 col-md-3",
      "col-4 col-md-2",
      "col-8 col-md-2"
    ];
    let category_class = `cl${expenditure.category}`;
    super(parent, elements, col_desc, [
      ["class", category_class],
      ["data-expenditure-uid", expenditure.uid]
    ]);
    this.expenditure = expenditure;
    this.selectable_items = selectable_items;
    this.set_handler("click", () => {
      environment.emit("edit_mode", expenditure);
    });
  }

  /*  repr() {
    let date_string = new Date(this.expenditure.date).toLocaleDateString();
    let ret = date_string + " ";
    ret +=
      get_attr_by_attr_in_array(
        this.selectable_items.buyers,
        "_value",
        this.expenditure.buyer,
        "_label"
      ) + " ";
    ret +=
      get_attr_by_attr_in_array(
        this.selectable_items.categories,
        "_value",
        this.expenditure.category,
        "_label"
      ) + " ";
    ret += this.expenditure.detail + " ";
    ret += this.expenditure.amount + " ";
    ret += get_attr_by_attr_in_array(
      this.selectable_items.pay_methods,
      "_value",
      this.expenditure.pay_method,
      "_label"
    );
    return ret;
  }
  */
}

class category_row extends html.bs_row {
  constructor(parent, category) {
    let label = category.label;
    let color_sample = new html.span(
      "autoparent",
      "",
      new Map([
        ["class", "oi oi-media-stop"],
        ["style", "color:" + category.color]
      ])
    );
    let col_desc = ["col-6", "col-1"];
    let elements = [label, color_sample];
    super(
      parent,
      elements,
      col_desc,
      new Map([["data-category-uid", category.uid]])
    );
    this.set_handler("click", () =>
      environment.emit("edit_category_mode", category)
    );
  }
}

/**
 * Generic item list class
 * @extends html.div
 */
class items_list_old extends html.div {
  /**
   * Crates a div with a list "item_row" elements.
   * @param {html.activ_html_base | string} parent - The parent element or a string with the ID of the parent html element.
   * @param {array} items - An array of the logic.rich_option_elements to be listed.
   * @param {class} item_row_class - The html.bs_row subclass for the item rows representation.
   * @param {object} selectable_items - Object holding the descrptions of selectable attributes of the items.
   */
  constructor(parent, items, item_row_class, selectable_items) {
    let list_items = items.map(
      item => new item_row_class("autoparent", item, selectable_items)
    );
    super(parent, list_items);
  }
}

/**
 * Generic item list class
 * @extends html.div
 */
class items_list extends html.div {
  /**
   * Crates a div with a list "item_row" elements.
   * @param {html.activ_html_base | string} parent - The parent element or a string with the ID of the parent html element.
   * @param {object} items - ---- An array of the logic.rich_option_elements to be listed.
   * @param {class} item_row_class - The html.bs_row subclass for the item rows representation.
   * @param {object} selectable_items - Object holding the descrptions of selectable attributes of the items.
   */
  constructor(parent, items, type, item_row_class, selectable_items) {
    let list_items = items.map(
      item => new item_row_class("autoparent", item, type, selectable_items)
    );
    super(parent, list_items);
  }
}

class expenditure_list extends html.div {
  constructor(parent, expenditures, selectables) {
    //let selectables_data = selectables[1];
    let selectables_items = {};
    for (let selectable of Object.entries(selectables)) {
      let selectable_type = selectable[0]
      let selectable_data = selectable[1];
      let selectable_items = selectable_data.items;
      selectables_items[selectable_type] = selectable_items;
    }
    let list = new items_list_old(
      "autoparent",
      expenditures,
      expenditure_row,
      selectables_items
    );
    let buttons = new top_buttons("autoparent");
    let inner = [buttons, list];
    super(parent, inner);
    //this.selectable_items = selectable_items;
  }
}

class categories_list extends items_list_old {
  constructor(parent, categories) {
    let items = categories.items;
    let item_row_class = category_row;
    super(parent, items, item_row_class);
  }
}

class edit_categories_pane extends html.div {
  constructor(parent, categories) {
    let back_button = new html.button(
      "autopartent",
      new html.span(
        "autoparent",
        "",
        new Map([["class", "oi oi-chevron-left"]])
      ),
      new Map([["type", "button"], ["class", "btn btn-primary col-2 col-sm-1"]])
    );
    let new_category_button = new html.button(
      "autoparent",
      "New category",
      new Map([
        ["class", "btn btn-primary col-8 offset 2 col-sm-4 offset-sm-2"]
      ])
    );

    back_button.set_handler("click", () => {
      environment.emit("list_mode");
    });

    new_category_button.set_handler("click", () => {
      environment.emit("add_category_mode");
    });

    let list = new categories_list("autoparent", categories);
    let inner = [back_button, new_category_button, list];
    super(parent, inner);
  }
}

/*class control_button extends html.button {
  constructor(parent) {
    super(parent);
    this.set_add_mode();
  }

  set_add_mode() {
    this.set_text("View expenditures");
    this.set_handler("click", () => {
      this.set_list_mode();
    });
    this.redraw();
    this.link_handlers();
    environment.emit("add_mode");
  }

  set_list_mode() {
    this.set_text("Add expenditure");
    this.set_handler("click", () => {
      this.set_add_mode();
    });
    this.redraw();
    this.link_handlers();
    environment.emit("list_mode");
  }
}*/

class top_buttons extends html.div {
  constructor(parent) {
    let logout_button = new html.button(
      "autopartent",
      new html.span(
        "autoparent",
        "",
        new Map([["class", "oi oi-account-logout"]])
      ),
      new Map([["type", "button"], ["class", "btn btn-primary col-2 col-sm-1"]])
    );

    let add_expediture_button = new html.button(
      "autoparent",
      "New expenditure",
      new Map([
        ["type", "button"],
        ["class", "btn btn-primary col-8 offset 2 col-sm-4 offset-sm-2"]
      ])
    );

    let settings_button = new html.button(
      "autopartent",
      new html.span("autoparent", "", new Map([["class", "oi oi-cog"]])),
      new Map([
        ["type", "button"],
        ["class", "btn btn-primary col-2 col-sm-1 offset-sm-1"]
      ])
    );
    
    let download_data_button = new html.button(
      "autopartent",
      new html.span("autoparent", "", new Map([["class", "oi oi-data-transfer-download"]])),
      new Map([
        ["type", "button"],
        ["class", "btn btn-primary col-2 col-sm-1"]
      ])
    );

    add_expediture_button.set_handler("click", () => {
      environment.emit("add_mode");
    });

    settings_button.set_handler("click", () => {
      environment.emit("settings");
    });

    logout_button.set_handler("click", () => {
      logout_button.blur();
      if (confirm("Do you want logout?")) {
        environment.emit("logout");
      }
    });
    
    download_data_button.set_handler("click", () => {
      environment.emit("download_data");
    });

    let inner = [logout_button, add_expediture_button, settings_button, download_data_button];
    super(parent, inner);
  }
}

class selectable_row extends html.bs_row {
  constructor(parent, item, selectable_type) {
    console.error(selectable_type)
    selectable_type = selectable_type.toLowerCase();
    let label = item.label;
    let color_sample = new html.span(
      "autoparent",
      "",
      new Map([["class", "oi oi-media-stop"], ["style", "color:" + item.color]])
    );
    let col_desc = ["col-6", "col-1"];
    let elements = [label, color_sample];
    let uid_html_attribute = "data-" + selectable_type + "-uid";
    let edit_message = "edit_" + selectable_type + "_mode";
    super(
      parent,
      elements,
      col_desc,
      new Map([[uid_html_attribute, item.uid]])
    );
    this.set_handler("click", () => environment.emit(edit_message, item));
  }
}

class selectable_list extends items_list {
  constructor(parent, items, type) {
    super(parent, items, type, selectable_row);
  }
}

class edit_selectables_pane extends html.div {
  constructor(parent, selectables) {
    let back_button = new html.button(
      "autopartent",
      new html.span(
        "autoparent",
        "",
        new Map([["class", "oi oi-chevron-left"]])
      ),
      new Map([["type", "button"], ["class", "btn btn-primary col-2 col-sm-1"]])
    );

    let cards_divs = new Array();
    let cards = {};
    for (let selectable of Object.entries(selectables)) {
      let selectable_data = selectable[1];
      let selectable_type = selectable_data.type.toLowerCase();
      let card = new edit_selectables_pane_card("autoparent", selectable);
      card.control.list.hide();
      card.control.add_button.hide();
      cards_divs.push(card);
      cards[selectable_type] = card;
    }

    back_button.set_handler("click", () => {
      environment.emit("list_mode");
    });

    let inner = [back_button, ...cards_divs];
    super(parent, inner);

    this.cards = cards;
    this.cards_divs = cards_divs;
  }

  update(selectables) {
    for (let selectable of Object.entries(selectables)) {
      let selectable_data = selectable[1];
      let selectable_type = selectable_data.type.toLowerCase();
      this.cards[selectable_type].update(selectable_data);
    }
  }
}

class edit_selectables_pane_card extends html.div {
  constructor(parent, selectable) {
    let type = selectable[1].label.toLowerCase();
    let logic_type = selectable[1].type;
    console.log(selectable[1])
    let add_item_message = "add_" + type + "_mode";
    let list_mode_message = "list_" + type + "_mode";
    let label = selectable[1].label;
    let items = selectable[1].items;
    let button_label = label;
    let title_button = new html.button(
      "autoparent",
      button_label,
      new Map([
        ["class", "btn btn-block btn-outline-primary col-sm-4 offset-sm-2"]
      ])
    );
    let add_button = new html.button(
      "autoparent",
      "Add",
      new Map([
        ["class", "btn btn-primary col-8 offset 2 col-sm-4 offset-sm-2"]
      ])
    );

    add_button.set_handler("click", () => {
      environment.emit(add_item_message);
    });

    let list = new selectable_list("autoparent", items, type);
    let inner = [title_button, add_button, list];
    super(parent, inner);
    this.control = {};
    this.control.title_button = title_button;
    this.control.add_button = add_button;
    this.control.list = list;
    this.control.type = type;

    title_button.set_handler("click", () => {
      this.control.list.toggle();
      this.control.add_button.toggle();
    });

  }
  update(selectable_data) {
    let is_list_hidden = this.inner[2].attributes.get("hidden");
    let type = selectable_data.label;
    let items = selectable_data.items;
    let list = new selectable_list("autoparent", items, type);
    if (is_list_hidden) {
      list.hide();
    }
    this.inner[2] = list;
    this.control.list = list;
  }
}

export {
  init,
  login_form,
  expenditure_input_form,
  expenditure_row,
  expenditure_list,
  get_styles,
  edit_categories_pane,
  category_form,
  edit_selectables_pane,
  selectable_form
  //control_button
};
