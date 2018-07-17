import * as fs from 'fs';

let init_filename = 'init_data.json';
let transactions_filename = 'transactions.json';

function load_init_file(f) {
    fs.readFile(init_filename, 'utf8', (err, data) => {
        f(err, data);
    });
}

function load_expenditures(f)
{
    fs.readFile(transactions_filename, 'utf8', (err, data) => {
        f(err, data);
    });
}

function save_expenditures(expenditures, f) {
    fs.writeFile(transactions_filename, JSON.stringify(expenditures), 'utf8', (err) => {
        f(err);
    });
}


export {load_init_file, load_expenditures, save_expenditures};