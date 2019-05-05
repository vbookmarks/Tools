class cArray{
    private tbl: Table;
  
    constructor(_json: any, _tbl?: Table) {
      this.tbl = _tbl || new Table();
    }
  
    generateArrayTable(arr: any): Table {
        let prevItemType: string;
        let tblInstance: Table;

        arr.map((item, index) => {
            let itemType = Utils.getType(item);

            if(itemType == 'object'){
                if(prevItemType == ""){
                    let objArr = new ObjectArray();
                    objArr.appendObject(index, item);
                }
            }
        });
      return this.tbl;
}