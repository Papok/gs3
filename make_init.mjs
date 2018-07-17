import * as logic from '/home/ubuntu/workspace/client/common/logic_classes.mjs';
import * as fs from 'fs'

let categories = [];
let categories_names = ['Super', 'Farmacia', 'Educación', 'Extra-curricular', 'Esparcimiento', 'Gastos Casa', 'Comida Afuera'];
for (let categorie of categories_names) {
    categories.push(new logic.Category(categorie));
}

let buyers = [];
let buyers_names = ['Julieta', 'Papo'];
for (let buyer of buyers_names) {
    buyers.push(new logic.Buyer(buyer));
}

let pay_methods = [];
let pay_methods_names = ['Efectivo',
    'Comafi Crédito', 'Comafi Débito',
    'Galicia Visa Crédito', 'Galicia Visa Débito',
    'Galicia Máster Crédito', 'Galicia Máster Débito',
    'Santander Crédito', "Santander Débito",
    'Nación Débito'
];

for (let pay_method of pay_methods_names) {
    pay_methods.push(new logic.PayMethod(pay_method))
}

let init_data = {
    categories: {
        data: categories,
        type: "Category"
    },
    buyers: {
        data: buyers,
        type: "Buyer"
    },
    pay_methods: {
        data: pay_methods,
        type: "PayMethod"
    }
};

let init_filename = 'init_data.json'

fs.access(init_filename, fs.constants.F_OK, (err) => {
    if (!err) {
        console.log("Init file already exists!")
    }
    else {
        if (err.errno === -2) {
            fs.writeFile(init_filename, JSON.stringify(init_data), 'utf8', (err) => {
                if (err) {
                    //console.log("Error writing file.", err)
                    process.exit(1)
                }
                else {
                    console.log("Done.")
                    fs.readFile(init_filename, 'utf8', (err, data) => {
                        if (err) {
                            console.log("Error reading file.", err)
                            process.exit(1)
                        }
                        else {
                            //console.log(JSON.parse(data))
                        }
                    })
                }
            })
        }
        else {
            console.log("Error", err)
        }
    }
})
