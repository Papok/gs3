import * as html from './html_classes.js';

var socket = undefined;
var environment = undefined;

function init(env) {
    environment = env;
    socket = env.socket;
}

function get_attr_by_attr_in_array(array, search_attr, search_value, ret_attr) {
    return array[array.findIndex(item => item[search_attr] == search_value)][ret_attr];
}

class expenditure_input_form extends html.bs_form {
    constructor(parent, selectable_items) {
        //
        // Date
        //

        let date_label = 'Date';
        let date_input = new html.date_input('autoparent', new Date(), new Map([
            ['class', 'form-control']
        ]));
        let date_form = new html.bs_form_group('autoparent', date_label, date_input, new Map([
            ['class', 'col-6 col-sm-4 col-md-3 mb-3'],
        ]));

        //
        // Buyer
        //
        let buyer_label = 'Buyer';
        let buyer_select = new html.rich_select('autoparent', selectable_items.buyers, new Map([
            ['class', 'form-control']
        ]));
        let buyer_form = new html.bs_form_group('autoparent', buyer_label, buyer_select, new Map([
            ['class', 'col-6 col-sm-4 col-md-3 mb-3'],
        ]));


        //
        // Category
        //
        let category_label = 'Category';
        let category_select = new html.rich_select('autoparent', selectable_items.categories, new Map([
            ['class', 'form-control']
        ]));
        let category_form = new html.bs_form_group('autoparent', category_label, category_select, new Map([
            ['class', 'col-12 col-sm-4 col-md-3 order-md-4 mb-3'],
        ]));


        //
        // Detail
        //
        let details_label = 'Detail';
        let details_text_input = new html.text_input('autoparent', new Map([
            ['class', 'form-control']
        ]));
        let details_form = new html.bs_form_group('autoparent', details_label, details_text_input, new Map([
            ['class', 'col-8 col-sm-8 col-md-6 order-md-5 mb-3'],
        ]));

        //
        // Amount
        //
        let amount_label = 'Amount';
        let amount_text_input = new html.number_input('autoparent', new Map([
            ['class', 'form-control']
        ]));
        let amount_form = new html.bs_form_group('autoparent', amount_label, amount_text_input, new Map([
            ['class', 'col-4 col-sm-4 col-md-2 order-md-6 mb-3'],
        ]));

        //
        // Pay Method
        //
        let pay_method_label = 'Pay Method';
        let pay_method_select = new html.rich_select('autoparent', selectable_items.pay_methods, new Map([
            ['class', 'form-control']
        ]));
        let pay_method_form = new html.bs_form_group('autoparent', pay_method_label, pay_method_select, new Map([
            ['class', 'col-12 col-sm-8 col-md-6 mb-3 order-11 order-md-3'],
        ]));

        //
        // Submit Button
        //
        let submit_button = new html.button('autoparent', 'Send', new Map([
            ['type', 'button'],
            ['class', 'col-12 col-sm-4 col-md-1 mb-3 order-12 order-md-12'],
        ]));


        let form_elements = {
            date: date_form,
            buyer: buyer_form,
            category: category_form,
            pay_method: pay_method_form,
            detail: details_form,
            amount: amount_form,
            button: submit_button
        };

        super(parent, form_elements, new Map([
            ['class', 'form-row']
        ]));
    }

    update_options(selectable_items) {
        this.elements.buyer.control.update_options(selectable_items.buyers);
        this.elements.category.control.update_options(selectable_items.categories);
        this.elements.pay_method.control.update_options(selectable_items.pay_methods);
    }

    get_data() {
        let ret = {
            date: (new Date(this.elements.date.control.value)).getTime(),
            buyer: this.elements.buyer.control.value,
            category: this.elements.category.control.value,
            pay_method: this.elements.pay_method.control.value,
            detail: this.elements.detail.control.value,
            amount: this.elements.amount.control.value,
        };
        return ret;
    }
}

class expenditure_row extends html.bs_row {
    constructor(parent, expenditure, selectable_items) {
        let elements = [
            (new Date(expenditure.date)).toLocaleDateString(),
            get_attr_by_attr_in_array(selectable_items.buyers, '_value', expenditure.buyer, '_label'),
            get_attr_by_attr_in_array(selectable_items.categories, '_value', expenditure.category, '_label'),
            expenditure.detail,
            expenditure.amount,
            get_attr_by_attr_in_array(selectable_items.pay_methods, '_value', expenditure.pay_method, '_label')
        ];
        let col_desc = [
            'col-md-2',
            'col-md-1',
            'col-md-2',
            'col-md-3',
            'col-md-2',
            'col-md-2',
        ];
        super(parent, elements, col_desc/*, [
            ["style", "overflow:hidden;white-space: nowrap;text-overflow:ellipsis"],
        ]*/)
        this.expenditure = expenditure;
        this.selectable_items = selectable_items;
    }

    repr() {
        let date_string = (new Date(this.expenditure.date)).toLocaleDateString();
        let ret = date_string + " ";
        ret += get_attr_by_attr_in_array(this.selectable_items.buyers, '_value', this.expenditure.buyer, '_label') + " ";
        ret += get_attr_by_attr_in_array(this.selectable_items.categories, '_value', this.expenditure.category, '_label') + " ";
        ret += this.expenditure.detail + " ";
        ret += this.expenditure.amount + " ";
        ret += get_attr_by_attr_in_array(this.selectable_items.pay_methods, '_value', this.expenditure.pay_method, '_label');
        return ret;
    }
}

class expenditure_list extends html.div {
    constructor(parent, expenditures, selectable_items) {
        let list_items = expenditures.map((expenditure) => new expenditure_row('autoparent', expenditure, selectable_items));
        for (let item of list_items) {
            item.set_handler('click', () => {
                item.remove(); // the items of items_list will be put inside an 'li' element by the unrdered_list contructor, so we romeve the 'li' element.
                socket.emit('delete_expenditure', item.expenditure.uid);
            });

        }
        let list = new html.div ('autoparent', list_items);
        let inner = [list, ];
        super(parent, inner);
    }
}

export { init, expenditure_input_form, expenditure_row, expenditure_list };
