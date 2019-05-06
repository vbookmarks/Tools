class Grid {
  private parentElement: any;
  constructor(public _parentElement: any) {
    this.parentElement = _parentElement;
  }

  public generateGrid(json: any) {
    this.startFlow(json);
  }

  public expandAll() {}

  public collapseAll() {}

  private startFlow(json: any) {
    if (Utils.getType(json) == "object") {
      let cObj = new cObject();
      let objTbl = cObj.generateObjectTable(json);
      this.parentElement.appendChild(objTbl);
    } else if (Utils.getType(json) == "array") {
      let cArr = new cArray();
      let arrTabls: Table[] = cArr.generateArrayTable(json);
      arrTabls.map(tbl => {
        this.parentElement.appendChild(tbl);
      });
    } else {
      this.parentElement.appendChild(`<span>${json}</span>`);
    }
  }
}
