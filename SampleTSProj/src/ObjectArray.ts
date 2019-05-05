class ObjectArray {
  private tbl: Table;
  private headers: string[];
  private headerRow: TableRow;
  private objs: any;
  constructor(_tbl?: Table) {
    this.tbl = _tbl || new Table();
    this.addHeaderRow();
  }

  private addHeaderRow() {
    this.headerRow = this.tbl.addRow();
  }

  appendObject(index: number, obj: any) {
    for (let key in obj) {
      if (this.headers.indexOf(key) == -1) {
        this.headers.push(key);
        let td = this.headerRow.addCell();
        td.setValue(key);
      }

      this.objs.push(obj);
    }
  }

  commit() {
    this.objs.map(obj => {
      let tr = this.tbl.addRow();
      this.headers.map(h => {
        let val = obj[h];
        if (val == null) {
          tr.addCell();
        } else {
          let td = tr.addCell();
          td.setValue(val);
        }
      });
    });
  }
}
