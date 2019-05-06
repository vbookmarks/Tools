var Grid = /** @class */ (function () {
    function Grid(_parentElement) {
        this._parentElement = _parentElement;
        this.parentElement = _parentElement;
    }
    Grid.prototype.generateGrid = function (json) {
        this.startFlow(json);
    };
    Grid.prototype.expandAll = function () { };
    Grid.prototype.collapseAll = function () { };
    Grid.prototype.startFlow = function (json) {
        var _this = this;
        if (Utils.getType(json) == "object") {
            var cObj = new cObject();
            var objTbl = cObj.generateObjectTable(json);
            this.parentElement.appendChild(objTbl);
        }
        else if (Utils.getType(json) == "array") {
            var cArr = new cArray();
            var arrTabls = cArr.generateArrayTable(json);
            arrTabls.map(function (tbl) {
                _this.parentElement.appendChild(tbl);
            });
        }
    };
    return Grid;
}());
var ObjectArray = /** @class */ (function () {
    function ObjectArray(_tbl) {
        this.tbl = _tbl || new Table();
    }
    ObjectArray.prototype.appendItem = function (index, obj) {
        for (var key in obj) {
            if (this.headers.indexOf(key) == -1) {
                this.headers.push(key);
            }
            this.objs.push(obj);
        }
    };
    ObjectArray.prototype.commit = function () {
        var _this = this;
        var headerRow = this.tbl.addRow();
        this.headers.map(function (h) {
            var td = headerRow.addCell();
            td.setValue(h);
        });
        this.objs.map(function (obj) {
            var tr = _this.tbl.addRow();
            _this.headers.map(function (h) {
                var val = obj[h];
                if (val == null) {
                    tr.addCell();
                }
                else {
                    var td = tr.addCell();
                    td.setValue(val);
                }
            });
        });
        return this.tbl;
    };
    return ObjectArray;
}());
var Table = /** @class */ (function () {
    function Table() {
        this.instance = document.createElement("table");
    }
    Table.prototype.addRow = function () {
        var tr = new TableRow();
        this.instance.appendChild(tr.instance);
        return tr;
    };
    return Table;
}());
var TableRow = /** @class */ (function () {
    function TableRow() {
        this.instance = document.createElement("tr");
    }
    TableRow.prototype.addCell = function () {
        var td = new TableCell();
        this.instance.appendChild(td.instance);
        return td;
    };
    return TableRow;
}());
var TableCell = /** @class */ (function () {
    function TableCell() {
        this.instance = document.createElement("td");
    }
    TableCell.prototype.setValue = function (val) {
        this.instance.appendChild(this.instance.createTextNode(val));
    };
    return TableCell;
}());
var Utils = /** @class */ (function () {
    function Utils() {
    }
    Utils.getType = function (v) {
        if (typeof v == "object") {
            if (v === null)
                return "null";
            if (v.constructor == new Array().constructor)
                return "array";
            if (v.constructor == new Date().constructor)
                return "date";
            //if (v.constructor == (new RegExp).constructor) return "regex";
            return "object";
        }
        return typeof v;
    };
    return Utils;
}());
var ValueArray = /** @class */ (function () {
    function ValueArray(_tbl) {
        this.tbl = _tbl;
    }
    ValueArray.prototype.appendItem = function (index, value) {
        this.values.push(value);
    };
    ValueArray.prototype.commit = function () {
        var _this = this;
        this.values.map(function (v) {
            var tr = _this.tbl.addRow();
            var td = tr.addCell();
            td.setValue(v);
        });
        return this.tbl;
    };
    return ValueArray;
}());
var cArray = /** @class */ (function () {
    function cArray() {
    }
    cArray.prototype.generateArrayTable = function (arr) {
        var _this = this;
        var prevItemType;
        var tblInstance;
        var arrTbl;
        arr.map(function (item, index) {
            var itemType = Utils.getType(item);
            if (itemType == "object") {
                if (prevItemType == "object") {
                    arrTbl = new ObjectArray(tblInstance);
                    arrTbl.appendItem(index, item);
                }
                else {
                    if (arrTbl != null) {
                        tblInstance = arrTbl.commit();
                        _this.tbls.push(tblInstance);
                        tblInstance = null;
                    }
                    arrTbl = new ObjectArray();
                    arrTbl.appendItem(index, item);
                }
            }
            else {
            }
        });
        return this.tbls;
    };
    cArray.prototype.processItem = function (item) { };
    return cArray;
}());
var cObject = /** @class */ (function () {
    function cObject() {
    }
    cObject.prototype.generateObjectTable = function (obj) {
        for (var key in obj) {
            var tr = this.tbl.addRow();
            var td1 = tr.addCell();
            td1.setValue(key);
            var td2 = tr.addCell();
            var val = obj[key];
            td2.setValue(val);
        }
        return this.tbl;
    };
    return cObject;
}());
//# sourceMappingURL=bundle.js.map