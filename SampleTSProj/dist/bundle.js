var Grid = /** @class */ (function () {
    function Grid(_parentElement) {
        this._parentElement = _parentElement;
        this.parentElement = _parentElement;
    }
    Grid.prototype.generateGrid = function (json) {
        this.startFlow(json);
    };
    Grid.prototype.expandAll = function () {
    };
    Grid.prototype.collapseAll = function () {
    };
    Grid.prototype.startFlow = function (json) {
        if (Utils.getType(json) == "object") {
            var objTable = new cObject();
            this.parentElement.appendChild(objTable);
        }
    };
    return Grid;
}());
var HTMLElementOptions = /** @class */ (function () {
    function HTMLElementOptions() {
    }
    return HTMLElementOptions;
}());
var Table = /** @class */ (function () {
    function Table() {
    }
    Table.prototype.addRow = function (obj) {
        throw new Error("Method not implemented.");
    };
    Table.prototype.addCell = function (val) {
        throw new Error("Method not implemented.");
    };
    return Table;
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
var cObject = /** @class */ (function () {
    function cObject() {
    }
    return cObject;
}());
//# sourceMappingURL=bundle.js.map