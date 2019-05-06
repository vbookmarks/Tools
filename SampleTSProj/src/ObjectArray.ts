class ObjectArray implements IArrayTable {
  private tbl: Table;
  private headers: string[];
  private objs: any;

  constructor(_tbl?: Table) {
    this.tbl = _tbl || new Table();
  }

  appendItem(index: number, obj: any) {
    for (let key in obj) {
      if (this.headers.indexOf(key) == -1) {
        this.headers.push(key);
      }

      this.objs.push(obj);
    }
  }

  commit() {
    let headerRow = this.tbl.addRow();
    this.headers.map(h => {
      let td = headerRow.addCell();
      td.setValue(h);
    });

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

    return this.tbl;
  }
}
