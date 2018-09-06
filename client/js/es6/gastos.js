/* global io */
/* global $ */
console.log("running-1")
import * as html from './html_classes.js';
import * as gs_html from './gs_html_classes.js';
import * as logic from '../../../common/logic_classes.mjs';

//import io from './socket.io-client'


function beep() {
    var snd = new Audio("data:audio/wav;base64,//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkWgAI0wWs/ItAAAGDgYtAgAyN+QWaAAihwMWm4G8QQRDiMcCBcH3Cc+CDv/7xA4Tvh9Rz/y8QADBwMWgQAZG/ILNAARQ4GLTcDeIIIhxGOBAuD7hOfBB3/94gcJ3w+o5/5eIAIAAAVwWgQAVQ2ORaIQwEMAJiDg95G4nQL7mQVWI6GwRcfsZAcsKkJvxgxEjzFUgfHoSQ9Qq7KNwqHwuB13MA4a1q/DmBrHgPcmjiGoh//EwC5nGPEmS4RcfkVKOhJf+WOgoxJclFz3kgn//dBA+ya1GhurNn8zb//9NNutNuhz31f////9vt///z+IdAEAAAK4LQIAKobHItEIYCGAExBwe8jcToF9zIKrEdDYIuP2MgOWFSE34wYiR5iqQPj0JIeoVdlG4VD4XA67mAcNa1fhzA1jwHuTRxDUQ//iYBczjHiTJcIuPyKlHQkv/LHQUYkuSi57yQT//uggfZNajQ3Vmz+Zt//+mm3Wm3Q576v////+32///5/EOgAAADVghQAAAAA//uQZAUAB1WI0PZugAAAAAoQwAAAEk3nRd2qAAAAACiDgAAAAAAABCqEEQRLCgwpBGMlJkIz8jKhGvj4k6jzRnqasNKIeoh5gI7BJaC1A1AoNBjJgbyApVS4IDlZgDU5WUAxEKDNmmALHzZp0Fkz1FMTmGFl1FMEyodIavcCAUHDWrKAIA4aa2oCgILEBupZgHvAhEBcZ6joQBxS76AgccrFlczBvKLC0QI2cBoCFvfTDAo7eoOQInqDPBtvrDEZBNYN5xwNwxQRfw8ZQ5wQVLvO8OYU+mHvFLlDh05Mdg7BT6YrRPpCBznMB2r//xKJjyyOh+cImr2/4doscwD6neZjuZR4AgAABYAAAABy1xcdQtxYBYYZdifkUDgzzXaXn98Z0oi9ILU5mBjFANmRwlVJ3/6jYDAmxaiDG3/6xjQQCCKkRb/6kg/wW+kSJ5//rLobkLSiKmqP/0ikJuDaSaSf/6JiLYLEYnW/+kXg1WRVJL/9EmQ1YZIsv/6Qzwy5qk7/+tEU0nkls3/zIUMPKNX/6yZLf+kFgAfgGyLFAUwY//uQZAUABcd5UiNPVXAAAApAAAAAE0VZQKw9ISAAACgAAAAAVQIygIElVrFkBS+Jhi+EAuu+lKAkYUEIsmEAEoMeDmCETMvfSHTGkF5RWH7kz/ESHWPAq/kcCRhqBtMdokPdM7vil7RG98A2sc7zO6ZvTdM7pmOUAZTnJW+NXxqmd41dqJ6mLTXxrPpnV8avaIf5SvL7pndPvPpndJR9Kuu8fePvuiuhorgWjp7Mf/PRjxcFCPDkW31srioCExivv9lcwKEaHsf/7ow2Fl1T/9RkXgEhYElAoCLFtMArxwivDJJ+bR1HTKJdlEoTELCIqgEwVGSQ+hIm0NbK8WXcTEI0UPoa2NbG4y2K00JEWbZavJXkYaqo9CRHS55FcZTjKEk3NKoCYUnSQ0rWxrZbFKbKIhOKPZe1cJKzZSaQrIyULHDZmV5K4xySsDRKWOruanGtjLJXFEmwaIbDLX0hIPBUQPVFVkQkDoUNfSoDgQGKPekoxeGzA4DUvnn4bxzcZrtJyipKfPNy5w+9lnXwgqsiyHNeSVpemw4bWb9psYeq//uQZBoABQt4yMVxYAIAAAkQoAAAHvYpL5m6AAgAACXDAAAAD59jblTirQe9upFsmZbpMudy7Lz1X1DYsxOOSWpfPqNX2WqktK0DMvuGwlbNj44TleLPQ+Gsfb+GOWOKJoIrWb3cIMeeON6lz2umTqMXV8Mj30yWPpjoSa9ujK8SyeJP5y5mOW1D6hvLepeveEAEDo0mgCRClOEgANv3B9a6fikgUSu/DmAMATrGx7nng5p5iimPNZsfQLYB2sDLIkzRKZOHGAaUyDcpFBSLG9MCQALgAIgQs2YunOszLSAyQYPVC2YdGGeHD2dTdJk1pAHGAWDjnkcLKFymS3RQZTInzySoBwMG0QueC3gMsCEYxUqlrcxK6k1LQQcsmyYeQPdC2YfuGPASCBkcVMQQqpVJshui1tkXQJQV0OXGAZMXSOEEBRirXbVRQW7ugq7IM7rPWSZyDlM3IuNEkxzCOJ0ny2ThNkyRai1b6ev//3dzNGzNb//4uAvHT5sURcZCFcuKLhOFs8mLAAEAt4UWAAIABAAAAAB4qbHo0tIjVkUU//uQZAwABfSFz3ZqQAAAAAngwAAAE1HjMp2qAAAAACZDgAAAD5UkTE1UgZEUExqYynN1qZvqIOREEFmBcJQkwdxiFtw0qEOkGYfRDifBui9MQg4QAHAqWtAWHoCxu1Yf4VfWLPIM2mHDFsbQEVGwyqQoQcwnfHeIkNt9YnkiaS1oizycqJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");
    snd.play();
}

var global = {}

console.log("Runing.");

var socket = io.connect();

global.socket = socket;
global.events = new Map();
global.on = function(event, f) {
    this.events.set(event, f);
};
global.emit = function(event, payload) {
    console.log(this.events)
    console.log(event)
    console.log(this.events.get(event))
    this.events.get(event)(payload);
};


html.init_html_classes(global);
gs_html.init(global);

var categories = [new logic.Category('Loading...', 0)];
var buyers = [new logic.Buyer('Loading...', 0)];
var pay_methods = [new logic.PayMethod('Loading...', 0)];

let selectable_items = { categories, buyers, pay_methods };

var expenditures = [];



$(document).ready(function() {
    console.log("ready")
    test();
});

function get_attr_by_attr_in_array(array, search_attr, search_value, ret_attr) {
    return array[array.findIndex(item => item[search_attr] == search_value)][ret_attr];
}

function test() {
    let new_transaction_form;
    let list = new html.active_html_base("expenditures_list");

    let login_box = new gs_html.login_form("login_box")
    login_box.draw();
    login_box.link_handlers();


    // coockie control
    let allcoockies = document.cookie;
    console.log(allcoockies)
    let coockiearray = allcoockies.split(';');
    for (let coockie of coockiearray) {
        let name = coockie.split('=')[0].trim();
        let value = coockie.split('=')[1].trim();
        console.log(coockie)
        if (name === "gs3user") {
            console.log('found')
            let last_user_label = new html.span("last_user", value)
            last_user_label.draw()
            break;
        }
    }
    /////////////////////

    socket.on('remote_log', function(text) {
        console.log("Server says:", text);
    });

    socket.on("render_page", function() {
        let new_transaction_form = new gs_html.expenditure_input_form("input_expenditure", {
            buyers: buyers,
            categories: categories,
            pay_methods: pay_methods
        })
        new_transaction_form.draw()
        new_transaction_form.link_handlers()
    });

    socket.on('init', function(data) {
        console.log('Init recived.')
        login_box.remove();
        let init_data = data;

        function deserialize_into(s_array, data_class) {
            let r_array = [];
            for (let item of s_array) {
                r_array.push(new logic[data_class](item._label, item._uid, item._color, item._uid));
            }
            return r_array;
        }
        for (let selectable of Object.keys(selectable_items)) {
            selectable_items[selectable] = deserialize_into(init_data[selectable].data, init_data[selectable].type);
        }

        let styles = gs_html.get_styles(selectable_items.categories);
        $('style').html(styles);

        new_transaction_form = new gs_html.expenditure_input_form("input_expenditure", selectable_items);
        // new_transaction_form.draw();
        // new_transaction_form.link_handlers();

        global.on("add_mode", function() {
            new_transaction_form.set_add_mode();
            new_transaction_form.draw();
            new_transaction_form.link_handlers();
            new_transaction_form.unhide()
            list.hide();
        });

        global.on("list_mode", function() {
            console.log("list_mode")
            new_transaction_form.hide()
            list.unhide();
            list.link_handlers()
        });

        global.on("edit_mode", function(fill_expenditure) {
            console.log("edit_mode")
            new_transaction_form.set_edit_mode(fill_expenditure)
            new_transaction_form.unhide()
            new_transaction_form.link_handlers()
            list.hide()
        })
    });

    socket.on('update_categories', function(recived_categories) {
        console.log('reciving categories');
        categories = recived_categories;
    });

    socket.on('update_expenditures', function(recived_expenditures) {
        update_expenditures(recived_expenditures);
    });



    socket.on('new_category', function(category) {
        categories.push(category);
    });

    function send(msg) {
        console.log('Sending message:', msg);
        socket.emit('message', msg);
    }

    socket.on('connect', function() {
        console.log("Socket connected");
        socket.emit('backlog', 'connected');
    });

    function update_expenditures(recived_expenditures) {
        expenditures = [];
        for (var i = 0; i < recived_expenditures.length; ++i) {
            expenditures[i] = new logic.Expenditure(recived_expenditures[i]);
        }
        list = new gs_html.expenditure_list("expenditures_list", expenditures, selectable_items);
        list.draw();
        list.link_handlers();
    }
}
