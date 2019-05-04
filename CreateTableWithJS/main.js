
function run() {
    console.log("Started.");
    var div = document.getElementById('grid');

    var tbl = cTbl(div);

    var headers = [];
    var trTh = cTr(tbl); 
   
    Rx.Observable.from(json.customerMDOutput).subscribe(obj => {
        var tr = cTr(tbl);
        for (var key in obj) {
            if (!(headers.indexOf(key) > -1)) {
                headers.push(key);
                cTh(trTh, key);
            }
            cTd(tr, obj[key]);
        }
    });
    console.log(headers);
}

function cTbl(parent) {
    var tbl = document.createElement('table');
    parent.appendChild(tbl);
    tbl.setAttribute('width', '100%');
    tbl.setAttribute('border', '1');
    var tbdy = document.createElement('tbody');
    tbl.appendChild(tbdy);
    return tbdy;
}

function cTr(parent) {
    var tr = document.createElement('tr');
    parent.appendChild(tr);
    return tr;
}

function cTd(parent, val) {
    var td = document.createElement('td');
    parent.appendChild(td);
    td.appendChild(document.createTextNode(val));
    return td;
}

function cTh(parent, val) {
    var th = document.createElement('th');
    parent.appendChild(th);
    th.appendChild(document.createTextNode(val));
    return th;
}