/**
 * Module csv - creates and exports to the client a csv file with the expenditures data.
 * @module
 */
 
/**
 * Class for a csv row of expenditure data.
 */
class Row {
  /**
   * Creates a csv row of expenditure data. Uses the selectables data to obtain the text representations of the selectable fields of the expenditure data.
   * @param {logic.Expenditure} expediture_data
   * @param {Object} selectables
   */
   constructor(expenditure_data, selectables) {
     let date = new Date(expenditure_data.date).toISOString().split("T")[0];
     let buyer = selectables.buyers.get_label(expenditure_data.buyer);
     let category = selectables.categories.get_label(expenditure_data.category);
     let detail = expenditure_data.detail;
     let amount = expenditure_data.amount;
     let pay_method = selectables.pay_methods.get_label(expenditure_data.pay_method);
     this._row_string = `${date},"${buyer}","${category}","${detail}",${amount},"${pay_method}"`;
   }
   
   /**
    * @type {string}
    */
   get row_string() {
     return this._row_string;
   }
}

/**
 * Class for a csv table of expenditure data.
 */
class Table {
  /**
   * Creates a table row of expenditure data. Uses the selectables data to obtain the text representations of the selectable fields of the expenditure data.
   * @param {array} expeditures_data
   * @param {Object} selectables
   */
   constructor(expenditures_data, selectables) {
     let table = "";
     for (let expenditure_data of expenditures_data) {
       let row = new Row(expenditure_data, selectables);
       table += row.row_string + '\n';
     }
     this._table = table;
   }
   
   /**
    * @type {string}
    */
    get table_string() {
      return this._table;
    }
}

export {Table};
  