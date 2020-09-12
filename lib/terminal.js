
const termkit = require("terminal-kit");
const term = termkit.terminal;
var document = term.createDocument();

const MESSAGE_HEIGHT = 3;
const MAP_HEIGHT = 40; // NetHack global.h: ROWNO = 21
const MAP_WIDTH = 120; // NetHack global.h: COLNO = 80
const STATS_HEIGHT = 2;
const VBORDER_ALLOWANCE = 2;
const HBORDER_ALLOWANCE = 2;
const DEBUG_HEIGHT = 20;
const debug = 1;

var messageWin;
var mapScreen;
var inventory;
var stats;
var layout;
var debugWin;

async function log(msg) {
    if(!debugWin) return;
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
            // log("got event:", args);
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



let inputEvents = eventGenerator(term, "key" /*, "mouse"*/);
async function getInput() {
    let event = await inputEvents.next();
    // TODO: mouse events
    // if event.value[0] is like "MOUSE_MOTION" it's a mouse event
    // full list here: https://github.com/cronvel/terminal-kit/blob/master/doc/events.md#ref.event.resize
    let keyName = event.value[0];
    let keyMatches = event.value[1];
    let keyData = event.value[2];
    // log("keyName" + keyName);
    // log("keyMatches" + keyMatches);
    log("keyData " + JSON.stringify(keyData));
    if (keyData.isCharacter === false) return 33; // ASCII 33 = ESC
    let ch = keyData.code;
    // log(`got ch: '${ch}'`);
    // ch = ch.charCodeAt(0);
    // terminal.log("ch num", ch);\
    // await delay(10000);
    return ch;
}

async function delay(count) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, count);
    });
}

function init() {
    term.clear();
    term.hideCursor();

    let layoutOpts = {
        parent: document ,
        boxChars: "lightRounded" ,
        layout: {
            id: "main" ,
            widthPercent: 100 ,
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
        parent: document.elements.message ,
        // content: "message" ,
        attr: { color: "white" },
        scrollable: true,
        vScrollBar: true,
        hScrollBar: false,
        width: term.width - VBORDER_ALLOWANCE,
        height: MESSAGE_HEIGHT
    });

    mapScreen = new termkit.Container({
        parent: document ,
        // content: "map" ,
        attr: { color: "green" , italic: true },
        inputX: 1,
        inputY: MESSAGE_HEIGHT + VBORDER_ALLOWANCE,
        inputWidth: MAP_WIDTH,
        inputHeight: MAP_HEIGHT
    });

    inventory = new termkit.Text({
        parent: document.elements.inventory ,
        content: "inventory" ,
        attr: { color: "yellow" , italic: true }
    });

    stats = new termkit.TextBox({
        parent: document.elements.stats ,
        // content: "stats" ,
        attr: { color: "cyan" , bold: true },
        width: term.width - HBORDER_ALLOWANCE,
        height: STATS_HEIGHT
    });

    debugWin = new termkit.TextBox({
        parent: document.elements.debug ,
        content: "--- DEBUG ---",
        attr: { color: "red" , bold: true },
        width: term.width - HBORDER_ALLOWANCE,
        scrollable: true,
        vScrollBar: true,
        hScrollBar: false,
        height: DEBUG_HEIGHT
    });

    term.on("key" , function(key) {
        // log(`got key: ${key}`);
        if (key === "CTRL_C") {
            term.grabInput(false);
            term.hideCursor(false);
            term.moveTo(1 , term.height)("\n");
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


// stats map
let sm = new Map([
    ["BL_CHARACTERISTICS", ""],
    ["BL_RESET", ""],
    ["BL_FLUSH", ""],
    ["BL_TITLE", ""],
    ["BL_STR", ""],
    ["BL_DX", ""],
    ["BL_CO", ""],
    ["BL_IN", ""],
    ["BL_WI", ""],
    ["BL_CH", ""],
    ["BL_ALIGN", ""],
    ["BL_SCORE", ""], // not shown?
    ["BL_CAP", ""], // not shown?
    ["BL_GOLD", ""],
    ["BL_ENE", ""],
    ["BL_ENEMAX", ""],
    ["BL_XP", ""],
    ["BL_AC", ""],
    ["BL_HD", ""], // not shown?
    ["BL_TIME", ""], // not shown?
    ["BL_HUNGER", ""], // not shown?
    ["BL_HP", ""],
    ["BL_HPMAX", ""],
    ["BL_LEVELDESC", ""],
    ["BL_EXP", ""],
    ["BL_CONDITION", ""], // not shown?
]);
function statusUpdate(type, value, chg, percentage, color) {
    // replace inlined gold glyph with $
    if(type === "BL_GOLD") {
        value = value.replace(/\\G[0-9A-Fa-f]{8}/gi, "$");
    }

    sm.set(type, value);
    let firstLine = `${sm.get("BL_TITLE")}  St:${sm.get("BL_STR")} Dx:${sm.get("BL_DX")} Co:${sm.get("BL_CO")} In:${sm.get("BL_IN")} Wi:${sm.get("BL_WI")} Ch:${sm.get("BL_CH")} ${sm.get("BL_ALIGN")}`;
    let secondLine = `${sm.get("BL_LEVELDESC")}  ${sm.get("BL_GOLD")} HP:${sm.get("BL_HP")}(${sm.get("BL_HPMAX")}) Pw:${sm.get("BL_ENE")}(${sm.get("BL_ENEMAX")}) AC:${sm.get("BL_AC")} Xp:${sm.get("BL_XP")}`;
    stats.setContent(firstLine);
    stats.appendLog(secondLine);
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
    statusUpdate
};

