//import uuid from 'uuid';

function gen_uid() {
  let timestamp = Date.now();
  if (timestamp == gen_uid.last_timestamp) {
    gen_uid.count++;
  } else {
    gen_uid.count = 0;
  }
  gen_uid.last_timestamp = timestamp;
  let uid = Date.now() * 1000 + gen_uid.count;
  return uid;
}

class rich_option_item {
  constructor(label = "void", value = undefined, color, uid = gen_uid()) {
    this._label = label;
    this._value = value === undefined ? uid : value;
    this.constructor.color_idx = ((this.constructor.color_idx || 0) + 45) % 256;
    let autocolor = "hsl(" + this.constructor.color_idx + ", 100%, 75%)";
    this._color = color === undefined ? autocolor : color;
    this._uid = uid;
  }

  get label() {
    return this._label;
  }

  set label(label_) {
    this.label = label_;
  }

  get value() {
    return this._value;
  }

  set value(value_) {
    this.value = value_;
  }

  get color() {
    return this._color;
  }

  set color(color_) {
    this._color = color_;
  }

  get uid() {
    return this._uid;
  }
}

class Category extends rich_option_item {
  constructor(label, value, color, uid) {
    super(label, value, color, uid);
  }
}

class Buyer extends rich_option_item {
  constructor(label, value, color, uid) {
    super(label, value, color, uid);
  }
}

class PayMethod extends rich_option_item {
  constructor(label, value, color, uid) {
    super(label, value, color, uid);
  }
}

class Expenditure {
  constructor(expenditure) {
    this.date = expenditure.date;
    this.category = expenditure.category;
    this.detail = expenditure.detail;
    this.amount = expenditure.amount;
    this.buyer = expenditure.buyer;
    this.pay_method = expenditure.pay_method;
    this.uid = expenditure.uid === undefined ? gen_uid() : expenditure.uid;
  }
}

class Selectable {
  constructor(selectable) {
    this.type = selectable.type;
    this.logic_class = selectable.logic_class;
    this.label = selectable.label;
    this.items = selectable.items;
  }

  get_item(item_uid) {
    for (let item of this.items) {
      if (item._uid == item_uid) {
        return item;
      }
    }
  }

  get_label(item_uid) {
    let item = this.get_item(item_uid);
    return item._label;
  }
}

class Selectables {
  constructor(selectables) {
    for (let selectable of Object.keys(selectables)) {
      this[selectable] = new Selectable(selectables[selectable]);
    }
  }
}

export { gen_uid, Expenditure, Buyer, PayMethod, Category, Selectables };
