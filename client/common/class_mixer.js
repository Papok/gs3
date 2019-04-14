/* global $ */

function concat_attributes(attributes_a, attributes_b) {
  var multiple_attributes_separators = new Map([
    ["class", " "],
    ["style", ";"]
  ]);
  for (const [attribute, b_value] of attributes_b) {
    let a_value = attributes_a.get(attribute)
      ? attributes_a.get(attribute)
      : "";
    if (multiple_attributes_separators.has(attribute)) {
      let separator = multiple_attributes_separators.get(attribute);
      a_value += (a_value != "" ? separator : "") + b_value;
    } else {
      a_value = b_value;
    }
    attributes_a.set(attribute, a_value);
  }
}

class MixinBiulder {
  constructor(superclass) {
    this.superclass = superclass;
  }

  with(...mixins) {
    return mixins.reduce((c, mixin) => mixin(c), this.superclass);
  }
}

let mix = superclass => new MixinBiulder(superclass);

let form_field = superclass =>
  class extends superclass {
    on_change(f) {
      $(this.selector).change(function() {
        f();
      });
    }
    on_input(f) {
      $(this.selector).on("input", function() {
        f();
      });
    }

    get value() {
      return $(this.selector).val();
    }

    set value(new_value) {
      this._value = new_value;
      concat_attributes(this.attributes, [["value", this._value]]);
      //this.redraw();
      $(this.selector).val(new_value);
    }
  };

let dependable = superclass =>
  class extends superclass {
    add_dependant(dependant) {
      if (this.dependants === undefined) {
        this.dependants = [];
      }
      if (this.dependants.includes(dependant)) {
        return;
      }
      this.dependants.push(dependant);
    }

    update_dependants() {
      for (let dependant of this.dependants) {
        dependant.update(this);
      }
    }
  };

export { MixinBiulder, mix, form_field, dependable };
