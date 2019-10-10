function highlightLine() {
    var start = parseInt($('#start').val()) - 1;
    var end = parseInt($('#end').val()) -1;
    var Range = ace.require('ace/range').Range;
    marker = editor.session.addMarker(new Range(start, 0, end, 1), "myMarker", "fullLine");
    //editor.session.setScrollTop((start * 14) - 20);
    editor.gotoLine(start, 0, true);
    //$('.ace_scrollbar').animate({ 'scrollTop': (50 * 14) - 20 }, 1);
}

function clearSel(){
    editor.getSession().removeMarker(marker);
}

function clearContent(){
    editor.setValue('', 0);
}

function clipContent(){
    var start = parseInt($('#start').val()) - 1;
    var end = parseInt($('#end').val()) -1;
    alert(editor.getSession().getLine(start));
}

function getErrorDetails(){
    alert(JSON.stringify(editor.getSession().getAnnotations()));
}

function getValue(){
    alert(JSON.stringify(editor.getValue()));
}

function onChange(e){
    //alert('OnChange: ' + JSON.stringify(e));
}


function onSessionChange(e){
    //alert('OnSessionChange: ' + JSON.stringify(e));
}

function search(){
    editor.execCommand("find");
}