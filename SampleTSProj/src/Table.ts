class Table {
  instance: any;
  className: string;
  attrs: any;

  constructor() {
    this.instance = document.createElement("table");
  }

  addRow() {
    let tr = new TableRow();
    this.instance.appendChild(tr.instance);
    return tr;
  }
}

class TableRow {
  instance: any;
  className: string;
  attrs: any;
  constructor() {
    this.instance = document.createElement("tr");
  }
  addCell() {
    let td = new TableCell();
    this.instance.appendChild(td.instance);
    return td;
  }
}

class TableCell {
  instance: any;
  className: string;
  attrs: any;
  constructor() {
    this.instance = document.createElement("td");
  }
  setValue(val: any) {
    this.instance.appendChild(this.instance.createTextNode(val));
  }
}
