class Grid {
  private parentElement: any;
  constructor(public _parentElement: any) {
    this.parentElement = _parentElement;
  }

  public generateGrid(json: any) {
    this.startFlow(json);
  }

  public expandAll(){

  }

  public collapseAll(){
      
  }

  private startFlow(json: any) {
    if(Utils.getType(json) == "object"){
        let objTable = new cObject(json);
        this.parentElement.appendChild(objTable);
    }
    else if(Utils.getType(json) == "array"){
      let objTable = new cObject(json);
      this.parentElement.appendChild(objTable);
  }
    
  }
}
