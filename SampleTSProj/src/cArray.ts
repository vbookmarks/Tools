class cArray {
  private tbls: Table[];

  constructor() {}

  generateArrayTable(arr: any): Table[] {
    let prevItemType: string;
    let tblInstance: Table;
    let arrTbl: IArrayTable;

    arr.map((item, index) => {
      let itemType = Utils.getType(item);

      if (itemType == "object") {
        if (prevItemType == "object") {
            arrTbl = new ObjectArray(tblInstance);
            arrTbl.appendItem(index, item);
        } else {
          if (arrTbl != null) {
            tblInstance = arrTbl.commit();
            this.tbls.push(tblInstance);
            tblInstance = null;
          }

          arrTbl = new ObjectArray();
          arrTbl.appendItem(index, item);
        }
        prevItemType = "object";
      }
      else {
          
      }

    });

    return this.tbls;
  }

  private processItem(item) {}
}
