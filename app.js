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

function sanitize(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function countIndent(line) {
    return line.length - line.replace(/^(\s+)[#-]/, "").length;
}

function textBody(line) {
    return sanitize(line).replace(/^(\s+)*[-#](\s)*/, "");
}

function createNodeList() {
    const text = document.getElementById('items').value;
    const lines = text.split('\n');

    const nodes = { indent: -1, parent: null, children: [], row: -1, col: -1, rows: 0, depth: 0 };
    let lastNode = null;
    let lastIndent = 0;
    let lastRow = -1;
    let lastColumn = -1;
    let maxRow = 0;
    let maxDepth = 0;

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
        const row = lastIndent >= indent ? lastRow + 1 : lastRow;
        const col = lastIndent >= indent ? parent.col + 1 : lastColumn + 1;
        const node = { body: textBody(line), indent: indent, parent: parent, children: [], row: row, col: col };

        parent.children.push(node);

        lastIndent = indent;
        lastRow = row;
        lastColumn = col;
        lastNode = node;
        maxRow = maxRow > row ? maxRow : row;
        maxDepth = maxDepth > col ? maxDepth : col;
    }

    nodes.depth = maxDepth + 1;
    nodes.rows = maxRow + 1;

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

function fillChildren(cells, children) {
    for (const node of children) {
        cells[node.row][node.col] = node.body;
        fillChildren(cells, node.children);
    }
}

function getRowspan(row, col, cells) {
    let span = 0;
    for (let i = row + 1; i < cells.length; i++) {
        if (cells[i][col]) {
            break;
        }
        span++;
    }

    return span + 1;
}

function createTable(nodeList) {
    const rowLength = nodeList.rows;
    const columnLength = nodeList.depth;

    const cells = new Array(rowLength);
    for (let i = 0; i < rowLength; i++) {
        cells[i] = new Array(columnLength).fill(null);
    }

    fillChildren(cells, nodeList.children);

    console.log(cells);

    let html = '<tbody><tr>';
    for (let i = 0; i < columnLength; i++) {
        html += `<th>Header Level ${i+1}</th>`;
    }
    html += '</tr><tr>';
    for (let i = 0; i < rowLength; i++) {
        for (let j = 0; j < columnLength; j++) {
            const rowspan = getRowspan(i, j, cells);
            console.log(rowspan, cells[i][j]);
            if (rowspan > 1 && cells[i][j]) {
                html += `<td rowspan="${rowspan}">${cells[i][j]}</td>`;
            } else {
                if (cells[i][j]) {
                    html += `<td>${cells[i][j]}</td>`;
                }
            }
        }
        html += '</tr>';
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