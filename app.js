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

    const nodeList = { indent: -1, parent: null, children: [], row: -1, col: -1, rows: 0, depth: 0 };
    let lastNode = null;
    let lastIndent = 0;
    let lastRow = -1;
    let lastColumn = -1;
    let maxRow = 0;
    let maxDepth = 0;

    function findParentNode(lastNode, indent) {
        if (lastNode == null) {
            return nodeList;
        } else if (lastNode.indent < indent) {
            return lastNode;
        } else {
            return findParentNode(lastNode.parent, indent);
        }
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.length == 0) {
            continue; //skip empty lines
        }

        const indent = countIndent(line);
        const parent = findParentNode(lastNode, indent);

        let row, col = (0, 0);
        if (lastIndent >= indent) {
            // go next row and get back to parent's children col
            row = lastRow + 1;
            col = parent.col + 1;
        } else {
            // keep row and go deeper col
            row = lastRow;
            col = lastColumn + 1;
        }

        const node = { body: textBody(line), indent: indent, parent: parent, children: [], row: row, col: col };
        parent.children.push(node);

        // save last status
        lastIndent = indent;
        lastRow = row;
        lastColumn = col;
        lastNode = node;

        // keep max row and depth
        maxRow = maxRow > row ? maxRow : row;
        maxDepth = maxDepth > col ? maxDepth : col;
    }

    nodeList.depth = maxDepth + 1;
    nodeList.rows = maxRow + 1;

    return nodeList;
}

// Print Node for debug
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

function convertNodesToCells(cells, nodes) {
    for (const node of nodes) {
        cells[node.row][node.col] = node.body;
        convertNodesToCells(cells, node.children);
    }
}

function getRowspan(row, col, cells) {
    let span = 0;
    for (let i = row + 1; i < cells.length; i++) {
        // increment while under row is empty
        if (cells[i][col]) {
            break;
        }

        // stop increment if next row is upper level item
        for (let j = col - 1; j >= 0; j--) {
            if (cells[i][j]) {
                return span + 1;
            }
        }
        span++;
    }

    return span + 1;
}

function getColspan(row, col, cells) {
    let span = 0;
    for (let j = col + 1; j < cells[row].length; j++) {
        // increment while deeper col is empty
        if (cells[row][j]) {
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

    convertNodesToCells(cells, nodeList.children);

    let html = '<tbody><tr>';
    for (let i = 0; i < columnLength; i++) {
        html += `<th>Header Level ${i+1}</th>`;
    }
    html += '</tr><tr>';
    for (let i = 0; i < rowLength; i++) {
        for (let j = 0; j < columnLength; j++) {
            if (cells[i][j]) {
                const rowspan = getRowspan(i, j, cells);
                const colspan = getColspan(i, j, cells);
                if (rowspan > 1) {
                    html += `<td rowspan="${rowspan}">${cells[i][j]}</td>`;
                } else if (colspan > 1) {
                    html += `<td colspan="${colspan}">${cells[i][j]}</td>`;
                    break;
                } else {
                    html += `<td>${cells[i][j]}</td>`;
                }
            }
        }
        html += '</tr>';
    }

    html += '</tbody>';
    const table = document.getElementById('table');
    table.innerHTML = html;
}

function convertItemList() {

    const nodeList = createNodeList();

    createTable(nodeList);
}