
const termkit = require("terminal-kit");
const util = require("util");

const MESSAGE_HEIGHT = 3;
const MAP_HEIGHT = 40; // NetHack global.h: ROWNO = 21
const MAP_WIDTH = 120; // NetHack global.h: COLNO = 80
const STATS_HEIGHT = 2;
const VBORDER_ALLOWANCE = 2;
const HBORDER_ALLOWANCE = 2;
const DEBUG_HEIGHT = 10;
const debug = 1;

var messageWin;
var mapScreen;
var inventory;
var stats;
var layout;
var debugWin;

async function log(... msg) {
    if(!debugWin) return;
    if (msg.length > 1) msg.join(" ");
    debugWin.appendLog(`${msg}`);
    // refresh();
}

async function message(msg) {
    if(!messageWin) return;
    messageWin.appendLog(`${msg}`);
    // refresh();
}

let done = false;
async function* eventGenerator(eventEmitter, ... events) {
    var queue = [];

    for (let event of events) {
        // console.log(`watching for '${event}' events...`);
        eventEmitter.on(event, (... args) => {
            // log("got event", event, args);
            queue.push(args);
        });
    }

    while(!done) {
        while(!queue.length) {
            // console.log("queue empty");
            await delay(50);
        }
        // log(`queue length: ${queue.length}`);
        // console.log("queue", queue);
        yield queue.shift();
    }
}

let inputEvents;
async function getInput() {
    let event = await inputEvents.next();
    // let keyName = event.value[0];
    // let keyMatches = event.value[1];
    // let keyData = event.value[2];
    // log("keyName: " + keyName);
    // log("keyMatches: " + keyMatches);
    // log("keyData: " + JSON.stringify(keyData));
    return event.value[0]; // return "key name" string
}

async function delay(count) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, count);
    });
}

var term, document;
async function init() {
    term = await termkit.getDetectedTerminal();
    term.clear();
    term.hideCursor();
    inputEvents = eventGenerator(term, "key" /*, "mouse"*/);
    document = term.createDocument();

    let layoutOpts = {
        parent: document,
        boxChars: "lightRounded",
        layout: {
            id: "main",
            widthPercent: 100,
            height: MESSAGE_HEIGHT + MAP_HEIGHT + STATS_HEIGHT + VBORDER_ALLOWANCE*2,
            rows: [
                {
                    id: "top",
                    height: MESSAGE_HEIGHT + VBORDER_ALLOWANCE,
                    columns: [
                        { id: "message", widthPercent: 100 }
                    ]
                },
                {
                    id: "middle",
                    height: MAP_HEIGHT + VBORDER_ALLOWANCE,
                    columns: [
                        { id: "map", width: MAP_WIDTH + HBORDER_ALLOWANCE },
                        { id: "inventory" }
                    ]
                },
                {
                    id: "bottom",
                    height: STATS_HEIGHT + VBORDER_ALLOWANCE,
                    columns: [
                        { id: "stats" },
                    ]
                }
            ]
        }
    };

    if(debug) {
        layoutOpts.layout.rows.push({
            id: "below-bottom",
            height: DEBUG_HEIGHT + VBORDER_ALLOWANCE,
            columns: [
                { id: "debug" },
            ]
        });
        layoutOpts.layout.height += DEBUG_HEIGHT + VBORDER_ALLOWANCE;
    }

    layout = new termkit.Layout(layoutOpts);

    messageWin = new termkit.TextBox({
        parent: document.elements.message,
        // content: "message",
        attr: { color: "white" },
        scrollable: true,
        vScrollBar: true,
        hScrollBar: false,
        width: term.width - VBORDER_ALLOWANCE,
        height: MESSAGE_HEIGHT
    });

    mapScreen = new termkit.Container({
        parent: document,
        // content: "map",
        attr: { color: "green", italic: true },
        inputX: 1,
        inputY: MESSAGE_HEIGHT + VBORDER_ALLOWANCE,
        inputWidth: MAP_WIDTH,
        inputHeight: MAP_HEIGHT
    });

    inventory = new termkit.TextBox({
        parent: document.elements.inventory,
        content: "inventory",
        // width: 30,
        // height: 30,
        autoWidth: true,
        autoHeight: true,
        attr: { color: "yellow", italic: true }
    });

    stats = new termkit.TextBox({
        parent: document.elements.stats,
        // content: "stats",
        attr: { color: "cyan", bold: true },
        width: term.width - HBORDER_ALLOWANCE,
        height: STATS_HEIGHT,
        contentHasMarkup: true,
    });

    debugWin = new termkit.TextBox({
        parent: document.elements.debug,
        content: "--- DEBUG ---",
        attr: { color: "red", bold: true },
        width: term.width - HBORDER_ALLOWANCE,
        scrollable: true,
        vScrollBar: true,
        hScrollBar: false,
        height: DEBUG_HEIGHT
    });

    term.on("key", function(key) {
        // log(`got key: ${key}`);
        if (key === "CTRL_C") {
            term.grabInput(false);
            term.hideCursor(false);
            term.moveTo(1, term.height)("\n");
            //term.clear();
            process.exit();
        }
        refresh();
    });

    // mapScreen.inputDst.fill({ char: "x" });
    refresh();
}

function refresh() {
// for testing
    // message.inputDst.fill({ char: "m" });
    // stats.inputDst.fill({ char: "s" });
    // inventory.inputDst.fill({ char: "i" });
    // redraw layout
    messageWin.draw({delta: true});
    // stats.inputDst.draw({delta: true});
    inventory.draw({delta: true});
    stats.draw({delta: true});
    layout.inputDst.draw({delta: true});

    // draw map over layout
    mapScreen.inputDst.draw({delta: true});
    document.inputDst.draw({delta: true});
}

function mapGlyph(x, y, glyph, bkglyph) {
    mapScreen.inputDst.put({
        x: x,
        y: y
    }, glyph);
    // refresh();
}

function mapClear() {
    mapScreen.clear();
    refresh();
}

function mapCursor(x, y) {
    // log("map cursor", x, y);
    // return mapScreen.moveTo(x, y);
    term.hideCursor();
}

function setStats(firstLine, secondLine) {
    // stats.clear();
    // stats.inputDst.put({
    //     x: 0,
    //     y: 0,
    //     markup: false
    // }, firstLine);
    // stats.inputDst.put({
    //     x: 0,
    //     y: 1,
    //     markup: false
    // }, secondLine);
    // refresh();
    stats.setContent(firstLine + "\n" + secondLine);
    // stats.appendLog(secondLine);
}

let invList = [];
function addInventory(str) {
    log("inventory adding:", str);
    invList.push(str);
}

function showInventory() {
    log("show inventory.");
    // for (let line of invList) {
    //     inventory.appendContent(line + "\n", false);
    // }
    inventory.setContent(invList.join("\n"), true, false);
    // inventory.setContent("test1\ntest2\ntest3\n", true, false);

    refresh();
}

function clearInventory() {
    inventory.clear();
    refresh();
}

// setInterval(() => {
//     log("this is a test");
// }, 30);

module.exports = {
    init,
    log,
    message,
    refresh,
    getInput,
    mapGlyph,
    mapClear,
    mapCursor,
    setStats,
    addInventory,
    showInventory,
    clearInventory
};

