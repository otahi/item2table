'use strict';

function copyTableToClipboard() {
    const range = document.createRange();
    const table = document.getElementById('table');
    range.selectNode(table);

    const selection = document.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    // deplicated but works on Chrome
    document.execCommand('copy')
}

function countIndent(line) {
    return line.length - line.replace(/^(\s+)[#-]/, "").length;
}

function textBody(line) {
    return line.replace(/^(\s+)*[-#](\s)*/, "");
}

function createNodeList() {
    const text = document.getElementById('items').value;
    const lines = text.split('\n');

    const nodes = { indent: -1, parent: null, children: [], row: 0, col: -1 };
    let lastNode = null;
    let lastIndent = -1;
    let lastRow = 0;
    let lastColumn = 0;

    function findParentNode(lastNode, indent) {
        if (lastNode == null) {
            return nodes;
        } else if (lastNode.indent < indent) {
            return lastNode;
        } else {
            return findParentNode(lastNode.parent, indent);
        }
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        console.log(`line:${i}, ${line}`)
        if (line.length == 0) {
            continue; //skip empty lines
        }

        const indent = countIndent(line);
        const parent = findParentNode(lastNode, indent);
        const row = lastIndent >= indent ? parent.row + 1 : lastRow;
        const col = lastIndent < indent ? lastColumn + 1 : parent.col + 1;
        const node = { body: textBody(line), indent: indent, parent: parent, children: [], row: row, col: col };

        parent.children.push(node);

        lastIndent = indent;
        lastRow = row;
        lastColumn = col;
        lastNode = node;
    }

    printNode(nodes);

    return nodes;
}

function printNode(nodeList) {
    if (nodeList.body) {
        console.log(`${nodeList.body}, row=${nodeList.row}, col=${nodeList.col}`);
    }
    const children = nodeList.children;
    for (const child of children) {
        console.log(`${child.body}, row=${child.row}, col=${child.col}`);
        for (const grandChild of child.children) {
            printNode(grandChild);
        }
    }
}

function getNumChildren(node) {
    let sum = 0;
    const children = node.children;

    if (children == null || children.length == 0) {
        return 0;
    }

    for (const child of children) {
        sum += getNumChildren(child);
    }

    return sum + 1;
}

function getDepth(nodeList) {
    let maxDepth = 0;
    const children = nodeList.children;

    if (children == null || children.length == 0) {
        return 1;
    }

    for (const child of children) {
        const depth = getDepth(child);
        maxDepth = depth > maxDepth ? depth : maxDepth;
    }

    return maxDepth + 1;
}

function createTable(nodeList) {
    const rowLength = getNumChildren(nodeList);
    const columnLength = getDepth(nodeList);

    let cells = new Array(rowLength);

    for (let i = 0; i < columnLength; i++) {
        cells[i] = new Array(columnLength).fill(null);
    }

    for (const node of nodeList.children) {
        //TODO
    }

    for (let i = 0; i < rowLength; i++) {
        for (let j = 0; j < columnLength; j++) {
            //TODO
            //            cells[i][j] = 
        }
    }

    console.log(cells);

    let html = '<tbody><tr>';
    for (let i = 0; i < getDepth(nodeList); i++) {
        html += `<th>Header Level ${i+1}</th>`;
    }
    html += '</tr>';
    for (const node of nodeList.children) {
        const numChildren = getNumChildren(node);
        html += `<tr><td rowspan=${numChildren-1}>${node.body}</td><td></td><td></td><td></td>`; //TODO
        html += `</tr>`
    }

    html += '</tbody>';
    const table = document.getElementById('table');
    table.innerHTML = html;

    console.log(html);
}

function convertItemList() {

    const nodeList = createNodeList();

    createTable(nodeList);
}