class cObject {
  private tbl: Table;

  constructor(_tbl?: Table) {
    this.tbl = _tbl || new Table();
  }

  generateObjectTable(obj: any): Table {
    for (let key in obj) {
      let tr = this.tbl.addRow();
      let td1 = tr.addCell();
      td1.setValue(key);

      let td2 = tr.addCell();
      let val = obj[key];
      td2.setValue(val);
    }
    return this.tbl;
  }
}
