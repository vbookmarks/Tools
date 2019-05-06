interface IArrayTable {
  appendItem(index: number, value: any): any;
  commit(): Table;
}
class ValueArray implements IArrayTable {
  private tbl: Table;
  private values: any;

  constructor(_tbl?: any) {
    this.tbl = _tbl;
  }

  appendItem(index: number, value: any) {
    this.values.push(value);
  }

  commit(): Table {
    this.values.map(v => {
      let tr = this.tbl.addRow();
      let td = tr.addCell();
      td.setValue(v);
    });
    return this.tbl;
  }
}
