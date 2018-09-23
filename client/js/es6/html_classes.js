/* global $ */

import * as logic from '../../../common/logic_classes.mjs';
import { MixinBiulder, mix, form_field } from '../../../common/class_mixer.js';

let id = 0;
let socket = undefined;
let environment = undefined;

let autodraw_set = true;

function init_html_classes(env) {
    environment = env;
    socket = env.socket;
}



function gen_id() {
    ++id;
    return "a" + id;
}

function str_pad(n) {
    return String("00" + n).slice(-2);
}

function attributes_string(attributes) {
    var string = '';
    attributes = attributes ? attributes : [];
    for (let [attr, value] of attributes) {
        if (typeof value === "boolean") {
            if (value) {
                string += attr + ' ';
            }
        }
        else {
            string += attr + '="' + value + '" ';
        }
    }
    return string.slice(0, -1);
}

function c_html(tag, attributes = [], inner = '') {
    const void_elements = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'meta', 'param', 'source', 'track', 'wbr'];
    var start_tag_start = '<' + tag + ' ';
    var start_tag_attributes = attributes_string(attributes);
    var start_tag_end = '>';
    var end_tag = void_elements.includes(tag) ? '' : '</' + tag + '>';
    let inner_html = '';
    for (let element of inner) {
        inner_html += (typeof element == 'string') ? element : element.html();
    }
    var ret_str = start_tag_start + start_tag_attributes + start_tag_end + inner_html + end_tag;
    return ret_str;
}

function concat_attributes(attributes_a, attributes_b) {
    var multiple_attributes_separators = new Map([
        ['class', ' '],
        ['style', ';']
    ]);
    for (const [attribute, b_value] of attributes_b) {
        let a_value = attributes_a.get(attribute) ? attributes_a.get(attribute) : '';
        if (multiple_attributes_separators.has(attribute)) {
            let separator = multiple_attributes_separators.get(attribute)
            a_value += ((a_value != '') ? separator : '') + b_value;
        }
        else {
            a_value = b_value
        }
        attributes_a.set(attribute, a_value);
    }
}

class attribute {
    constructor(type = '', value = '') {
        this.type = type;
        this.value = value;
    }

    get_string() {
        var string = this.type + '="' + this.value + '"';
        return string;
    }
}

function on_keypress(keycode_in, plain_click_func) {
    var selector = '#' + this.id;
    $(selector).keypress(function(event) {
        var keycode = (event.keyCode ? event.keyCode : event.which);
        if (keycode == keycode_in) {
            plain_click_func();
        }
    });
}

class active_html_base {
    constructor(parent,
        tag = 'html_base',
        inner = "This is an active_html_base elemente. It should not be here!",
        extra_attributes = new Map()) {

        this.tag = tag;
        this._set_inner(inner);
        this.id = gen_id();
        this.selector = '#' + this.id;
        this.attributes = new Map([
            ['id', this.id]
        ]);
        concat_attributes(this.attributes, extra_attributes);

        this.environment = environment;

        if (typeof parent == 'string') {
            this.parent = {};
            this.parent.id = parent;
            this.parent.selector = '#' + this.parent.id;
        }
        else {
            this.parent = parent;
        }

        this.events = new Map();
        this.drawn = false;
        this.autodraw = autodraw_set;
    }

    draw() {
        if (this.parent.id == 'autoparent') {
            console.log(this);
            console.error('Elements with "autoparent" parent can not be drawn.');
        }
        else {
            if (this.parent.inner !== undefined && this.parent.inner.length > 1) {
                this.parent.draw();
            }
            else {
                $(this.parent.selector).html(this.html());
            }
            this.drawn = true;
        }
    }

    redraw() {
        if (this.parent.id !== 'autoparent' && this.autodraw) {
            this.draw();
        }
    }

    remove() {
        document.querySelector(this.selector).remove()
    }

    link_handlers() {
        for (let [event, f] of this.events) {
            $(this.selector).on(event, f);
        }
        for (let element of this.inner) {
            if (typeof element != 'string') {
                element.link_handlers();
            }
        }
    }

    //returns html but also sets inners parent to this
    html() {
        this._set_inner(this.inner);
        this.drawn = true;
        return c_html(this.tag, this.attributes, this.inner);
    }

    set_handler(event, f) {
        this.events.set(event, f);
    }

    get_id() {
        return this.id;
    }

    get_inner() {
        return this.inner;
    }

    get_inner_string() {
        return $(this.selector).html();
    }

    _set_inner(inner) {
        this.inner = [].concat(inner);
        for (let element of this.inner) {
            if ((typeof element == "string" && this.tag != 'span') && element != "") {
                element = new span(this, element.toString());
            }
            if (typeof element != "string") {
                if (element.parent === undefined || element.parent.id === 'autoparent') {
                    element.parent = this;
                }
            }
        }
    }

    set_inner(inner) {
        this._set_inner(inner);
        this.draw();
        this.link_handlers();
    }

    add_attr(attribute_name, value) {
        let extra_attribute = [
            [attribute_name, value]
        ]
        concat_attributes(this.attributes, extra_attribute);
        $(this.selector).prop(attribute_name, value)
    }

    hide() {
        this.add_attr("hidden", true);
    }

    unhide() {
        this.add_attr("hidden", false);
    }

}

class span extends active_html_base {
    constructor(parent, inner, extra_attributes = []) {
        let tag = 'span';
        let attributes = new Map();
        concat_attributes(attributes, extra_attributes);
        super(parent, tag, inner, attributes);
    }
}

class div extends active_html_base {
    constructor(parent, inner, extra_attributes = []) {
        let tag = 'div'
        let attributes = new Map();
        concat_attributes(attributes, extra_attributes);
        super(parent, tag, inner, attributes);
    }
}

class button extends active_html_base {
    constructor(parent, inner = "", extra_attributes = []) {
        let tag = 'button';
        let attributes = new Map();
        concat_attributes(attributes, extra_attributes);
        super(parent, tag, inner, attributes);
        this.text = inner;
    }

    get_text() {
        console.log(this.inner[0]);
        return this.inner[0].get_inner_string();
    }

    set_text(text) {
        //this.inner[0].set_inner(text);
        this.inner[0] = text;
        this.text = text;
    }
}

class option extends active_html_base {
    constructor(parent = 'autoparent', label = 'void', value = label, extra_attributes = []) {
        let tag = 'option';
        let inner = label;
        let attributes = new Map([
            ['value', value]
        ]);
        concat_attributes(attributes, extra_attributes);
        super(parent, tag, inner, attributes);
        this._label = label;
        this._value = value;
    }

    get label() {
        return this._label;
    }

    set label(new_label) {
        this.label = new_label;
        this._set_inner(new_label);

    }

    get value() {
        return this._value;
    }

    set value(new_value) {
        this.value = new_value;
        //this.redraw();
        $(this.selector).val(new_value);
        console.log(new_value)

    }
}

class select extends active_html_base {
    constructor(parent = 'autoparent', options = [new option()], value = 0, extra_attributes = []) {
        let tag = 'select';
        let inner = [];
        let attributes = new Map([
            ['autocomplete', 'off']
        ]);
        concat_attributes(attributes, extra_attributes);
        super(parent, tag, inner, attributes);
        this._value = (value === 0) ? options[0].uid : value;
        this._options = options
        this._update_options(options);
    }

    draw() {
        super.draw();
        $(this.selector).val(this._value).trigger('change', true);
    }

    get value() {
        return $(this.selector).val()
    }

    set value(new_value) {
        this._value = new_value
        this._update_options(this._options)
        this.redraw()
    }

    _update_options(options = [new logic.rich_option_item()]) { // esto da error porque en ningun momento importo esta clase, aunque no debería llegar a la instancia donde no se provee "options"
        this._value = (this._value === 0) ? options[0]._value : this._value
        this.inner = [];
        for (let option of options) {
            this._add_option(option);
        }
    }

    _add_option(new_option) {
        if (this._value == new_option._value) {
            new_option.add_attr('selected', 'selected')
        }
        this.inner.push(new_option);

    }

    update_options(options = [new logic.rich_option_item()]) {
        this._update_options(options);
        if (this.drawn && this.autodraw) {
            this.draw();
        }
        else {
            console.log('tried to draw');
            console.log(this);
        }
    }

    add_option(option) {
        this._add_option(option);
        if (this.parent.id !== 'autoparent' && this.autodraw) {
            this.draw();
        }
    }
}

class rich_select extends select {
    constructor(parent = 'autoparent', options = [new logic.rich_option_item()], value = 0, extra_attributes = []) {
        let attributes = new Map();
        concat_attributes(attributes, extra_attributes);
        super(parent, options, value, attributes);
        this._update_options(options);
    }

    // _update_options(options = [new logic.rich_option_item()]) {
    //     this.inner = [];
    //     for (let option of options) {
    //         this._add_option(option);
    //     }
    // }

    _add_option(option_) {
        let label = option_.label;
        let value = option_.value;
        let color = option_.color;
        let background_color_set_string = "background-color: " + (color || "rgba(0, 0, 0, 0");
        // this.inner.push(new option(this, label, value, [
        //     ['style', background_color_set_string]
        // ]));
        let new_option = new option(this, label, value, [
            ['style', background_color_set_string]
        ]);
        super._add_option(new_option)

    }

    // update_options(options = [new logic.rich_option_item()]) {
    //     this._update_options(options);
    //     if (this.drawn && this.autodraw) {
    //         this.draw();
    //     }
    //     else {
    //         console.log('tried to draw');
    //         console.log(this);
    //     }
    // }

    // add_option(option) {
    //     this._add_option(option);
    //     if (this.parent.id !== 'autoparent' && this.autodraw) {
    //         this.draw();
    //     }
    // }
}

class label extends active_html_base {
    constructor(parent = 'autoparent', text = 'void', dest, extra_attributes = []) {
        let tag = 'label';
        let inner = text;
        let attributes = new Map([
            ['for', dest]
        ]);
        concat_attributes(attributes, extra_attributes);
        super(parent, tag, inner, attributes);
        this.text = text;
    }

    draw() {
        if (this.attributes.get('for') === undefined) {
            console.error('<label> element ' + this.id + ' has not defined \'for\' attrubute');
        }
        super.draw()
    }
}

class input extends mix(active_html_base).with(form_field) {
    constructor(parent, extra_attributes = []) {
        let tag = 'input';
        let inner = '';
        let attributes = new Map();
        concat_attributes(attributes, extra_attributes);
        super(parent, tag, inner, attributes);
    }
}

class text_input extends input {
    constructor(parent, extra_attributes = []) {
        let attributes = new Map([
            ['type', 'text'],
        ]);
        concat_attributes(attributes, extra_attributes);
        super(parent, attributes);
    }
}

class password_input extends input {
    constructor(parent, extra_attributes = []) {
        let attributes = new Map([
            ['type', 'password'],
        ]);
        concat_attributes(attributes, extra_attributes);
        super(parent, attributes);
    }
}


class number_input extends input {
    constructor(parent, extra_attributes = []) {
        let attributes = new Map([
            ['type', 'number'],
        ]);
        concat_attributes(attributes, extra_attributes);
        super(parent, attributes);
    }
}

class date_input extends input {
    constructor(parent, date, extra_attributes = []) {
        var dd = str_pad(date.getDate());
        var mm = str_pad(date.getMonth() + 1); //January is 0!
        var yyyy = date.getFullYear();
        var date_string = yyyy + '-' + mm + '-' + dd;
        //date_string = "2017-06-01"
        let attributes = new Map([
            ['type', 'date'],
            ['value', date_string]
        ]);
        concat_attributes(attributes, extra_attributes);
        super(parent, attributes);
    }

    get value() {
        let date = new Date($(this.selector).val());
        var offset_ms = new Date().getTimezoneOffset() * 60000;
        let time = date.getTime() + offset_ms;
        return time;
    }

    set value(_value) {
        let date = new Date(_value);
        let date_string = date.getFullYear() + '-' + str_pad(date.getMonth() + 1) + '-' + str_pad(date.getDate());
        super.value = date_string;
    }
}

class submit_input extends active_html_base {
    constructor(parent, text = "Submit", extra_attributes = []) {
        let tag = 'input';
        let inner = '';
        let attributes = new Map([
            ['type', 'submit'],
            ['value', text]
        ]);
        concat_attributes(attributes, extra_attributes);
        super(parent, tag, inner, attributes);
        if (parent.tag !== 'form' && parent.tag !== undefined) {
            console.warn('submit_input elements should be inside form elements. (' + this.id + ')');
        }
    }
}

class bs_form_group extends active_html_base {
    constructor(parent = 'autoparent', label_text = 'void', control = new active_html_base(), extra_attributes = []) {
        let tag = 'div';
        let form_label = (typeof label_text == 'string') ?
            new label(undefined, label_text, control.get_id()) : label_text;
        let inner = [form_label, control];
        let attributes = new Map([
            ['class', 'form-group']
        ]);
        concat_attributes(attributes, extra_attributes);
        super(parent, tag, inner, attributes);
        this.label = form_label;
        this.control = control;
    }

    get value() {
        return this.control.value;
    }

    set value(new_value) {
        this.control.value = new_value;
    }
}

class bs_form extends active_html_base {
    constructor(parent, elements, fields, buttons, extra_attributes = []) {
        let tag = 'form';
        let inner = [];
        for (let control of Object.values(elements /*fields*/)) {
            inner.push(control);
        }
        // for (let control of Object.values(buttons)) {
        //     inner.push(control);
        // }

        let attributes = new Map();
        concat_attributes(attributes, extra_attributes);
        super(parent, tag, inner, attributes);
        this.fields = fields;
        this.buttons = buttons;

    }

    get_values() {
        let ret = {};
        for (let [field, control] of Object.entries(this.fields)) {
            if (control.value !== undefined) {
                ret[field] = control.value;
            }
        }
        return ret;
    }

    get_data() {
        let ret = {};
        for (let [field, control] of Object.entries(this.fields)) {
            ret[field] = control.value;
        }
        return ret;
    }

    set_values(data) {
        for (let [field, control] of Object.entries(this.fields)) {
            control.value = data[field];
        }
        this.redraw()
    }
}

class bs_row extends div {
    constructor(parent = 'autoparent', elements = [], col_desc = [], extra_attributes = []) {
        let inner = [];

        let attributes = new Map([
            ['class', 'row']
        ]);
        concat_attributes(attributes, extra_attributes);
        super(parent, inner, attributes);
        for (let element_idx = 0; element_idx < elements.length; ++element_idx) {
            let col_desc_idx = element_idx % col_desc.length;
            this.inner.push(new div(this, elements[element_idx], [
                ['class', col_desc[col_desc_idx]]
            ]));
        }
    }
}

class bs_dd_button_item extends button {
    constructor(parent = 'autoparent', text = 'void', extra_attributes = []) {
        let attributes = new Map([
            ['class', 'dropdown-item'],
            ['type', 'button']
        ]);
        concat_attributes(attributes, extra_attributes);
        super(parent, text, attributes);
        this.value = this.text;
    }

    get_value() {
        return this.value;
    }
}

class bs_dd_menu extends active_html_base {
    constructor(parent = 'autoparent', options = [new bs_dd_button_item], extra_attributes = []) {
        let tag = 'div';
        let inner = options;
        let attributes = new Map([
            ['class', 'dropdown-menu']
        ]);
        concat_attributes(attributes, extra_attributes);
        super(parent, tag, inner, attributes);
        this.options = options;
    }

    get_option(option_idx) {
        return this.options[option_idx];
    }

    get_options() {
        return this.options;
    }
}

class bs_dd_button extends button {
    constructor(parent = 'autoparent', text = 'void', extra_attributes = []) {
        let attributes = new Map([
            ['class', 'btn dropdown-togle'],
            ['type', 'button'],
            ['data-toggle', 'dropdown']
        ]);
        concat_attributes(attributes, extra_attributes);
        super(parent, text, attributes);
    }
}
class bs_dd extends active_html_base {
    constructor(parent = 'autoparent', head = new bs_dd_button(), options_list = new bs_dd_menu(), extra_attributes = []) {
        let tag = 'div';
        let inner = [head, options_list];
        let attributes = new Map([
            ['class', 'dropdown']
        ]);
        concat_attributes(attributes, extra_attributes);
        super(parent, tag, inner, attributes);
        this.head = head;
    }

    set_head_text(text) {
        console.log(this.head)
        this.head.set_text(text)
    }
}

class bs_dd_value_on_button extends bs_dd {
    constructor(parent, menu, selected_option = 0, extra_attributes = []) {
        super(parent, new bs_dd_button('autoparent', menu.get_option(selected_option).get_value(), new Map([
            ['class', 'btn-block']
        ])), menu)
        for (let option of menu.get_options()) {
            option.set_handler('click', () => { this.set_head_text(option.get_text()) })
        }
    }
}

class bs_dd_text_input extends text_input {
    constructor(parent /*_dd*/ , placeholder = '', extra_attributes = []) {
        super(parent /*_dd.id*/ , placeholder, extra_attributes.concat([
            new attribute('class', 'dropdown-toggle'),
            new attribute('data-toggle', 'dropdown')
        ]));
        //this.parent_dd = parent_dd
    }


    link() {
        var self = this;
        on_keypress.call(this, '13', function() {
            self.selected_item = $(self.selector).val();
            $(self.selector).val(undefined);
            $(self.selector).attr('placeholder', self.selected_item);
            self.placeholder = self.selected_item;
            if (self.parent.list.items.indexOf(self.selected_item) < 0 && self.selected_item != '') {
                /*self.*/
                socket.emit('new_category', self.selected_item);
            }
        });
    }
}

class list_item extends active_html_base {
    constructor(parent, inner, extra_attributes = []) {
        let tag = 'li';
        let attributes = new Map();
        concat_attributes(attributes, extra_attributes);
        super(parent, tag, inner, attributes);

        // super(parent);
        // this.tag = 'li';
        // this.inner = inner;
        // this.extra_attributes = extra_attributes;
    }

    // html() {
    //     var attributes = [new attribute('id', this.id)];
    //     var full_attributes = attributes.concat(this.extra_attributes);
    //     return c_html(this.tag, full_attributes, this.inner);
    // }
}

class unordered_list extends active_html_base {
    constructor(parent, items, extra_attributes = []) {
        let tag = 'ul';
        let inner = items.map((item) => new list_item('autoparent', item));
        let attributes = new Map();
        concat_attributes(attributes, extra_attributes);
        super(parent, tag, inner, attributes);
        this.items = items;
    }
}

class bs_items_list extends active_html_base {
    constructor(parent, items, extra_attributes = []) {
        super(parent);
        var self = this;
        this.tag = 'ul';
        this.items = [];
        items.forEach(function(item) {
            var item_object = (typeof item == 'string') ? new list_item(self, item) : item; // atención! si paso un objeto item_list, este va a quedar con su propio antecesor.
            self.items.push(item_object)
        })
        this.extra_attributes = extra_attributes;
    }

    html() {
        var self = this;
        var attributes = [new attribute('id', this.id)];
        var full_attributes = attributes.concat(this.extra_attributes);
        var items_html = '';
        this.items.forEach(function(item) {
            items_html += item.html();
        });
        return c_html(this.tag, full_attributes, items_html);
    }
}

class bs_dd_items_list extends bs_items_list {
    constructor(parent, items, extra_attributes = []) {
        super(parent, items, extra_attributes.concat([
            new attribute('class', 'dropdown-menu')
        ]));

        this.items.forEach(function(item) {
            item.extra_attributes = [new attribute('class', 'dropdown-item')];
        });

    }

    values() {
        var ret = [];
        this.items.forEach(function(item) {
            ret.push(item.inner);
        });
        return ret;
    }

    link() {
        console.log("linking list")
        var self = this;
        this.items.forEach(function(item) {
            var this_item = this;
            console.log(this_item)
            $(item.selector).click(function(event) {
                event.stopPropagation();
                self.parent.input_box.placeholder = $(this).html();
                if (event.metaKey || event.ctrlKey) {
                    socket.emit('delete_category', self.parent.input_box.placeholder);
                }
                else {
                    $(self.parent.input_box.selector).dropdown('toggle');
                    $(self.parent.input_box.selector).val($(this).html());
                    $(self.parent.input_box.selector).attr('placeholder', self.parent.input_box.placeholder);
                }
            })

        })
    }
}


class bs_dd2 extends active_html_base {
    constructor(parent, items, selected_item = items[0], extra_attributes = []) {
        super(parent)
        this.extra_attributes = extra_attributes;
        this.input_box = new bs_dd_text_input(this, selected_item, [new attribute("class", "form-control")])
        this.list = new bs_dd_items_list(this, items);
    }

    html() {
        var tag = 'div';
        var attributes = [
            new attribute('class', 'dropdown'),
            new attribute('id', this.id)
        ];
        var full_attributes = attributes.concat(this.extra_attributes);
        var inner = this.input_box.html() + this.list.html();
        return c_html(tag, full_attributes, inner);
    }

    update_list(items) {
        console.log("updating...")
        this.list = new bs_dd_items_list(this, items /*, [new attribute("class", "form-control")]*/ );
        var list_values = this.list.values();
        if (list_values.indexOf(this.input_box.placeholder) < 0) {
            this.input_box.placeholder = list_values[0];
        }
    }

    get_value() {
        return this.input_box.get_value();
    }

    link() {
        this.input_box.link();
        this.list.link();
    }

}

class bs_date_picker extends active_html_base {
    constructor(parent, date = new Date, extra_attributes = []) {
        super(parent)
        this.tag = "input";
        this.extra_attributes = extra_attributes;
        this.inner = '';
        this.date_string = date.getFullYear() + '-' + str_pad(date.getMonth() + 1) + '-' + str_pad(date.getDate());
        var attributes = [
            new attribute('type', 'date'),
            new attribute('value', this.date_string),
            new attribute('id', this.id)
        ];
        this.full_attributes = attributes.concat(this.extra_attributes);
    }

    get_value() {
        return $(this.selector).val()
    }
}

class bs_column extends active_html_base {
    constructor(parent, size = '', inner = '', extra_attributes = []) {
        super(parent);
        this.size = (size == '' || size == 'col') ? 'col' : 'col-' + size;
        let attributes = [
            new attribute('class', this.size)
        ];
        this.full_attributes = attributes.concat(this.extra_attributes);
    }
}


export {
    mix,
    form_field,
    init_html_classes,
    span,
    div,
    option,
    select,
    rich_select,
    label,
    list_item,
    unordered_list,
    // attribute,
    // attributes_string,
    // c_html,
    active_html_base,
    text_input,
    password_input,
    number_input,
    date_input,
    submit_input,
    bs_form,
    bs_row,
    // bs_items_list,
    // bs_dd_text_input,
    // bs_dd_items_list,
    // bs_dd2,
    bs_dd,
    bs_dd_value_on_button,
    bs_dd_button,
    bs_dd_menu,
    bs_dd_button_item,
    button,
    bs_form_group,
    // bs_date_picker,
};
