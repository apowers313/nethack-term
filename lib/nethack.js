const nethackStart = require("@neth4ck/neth4ck");
let terminal = require("./terminal");
const process = require("process");

process.on("exit", (... args) => {
    console.log("caught process exit:", args);
});

let winCount = 0;
async function nethackShimCallback(name, ... args) {
    // terminal.log(`callback: ${name} ${args}`);
    switch (name) {
    case "shim_init_nhwindows":
        return await terminal.init();
    case "shim_create_nhwindow":
        winCount++;
        // console.log("creating window", args, "returning", winCount);
        return winCount;
    case "shim_print_glyph":
        return await printGlyph(... args);
    case "shim_display_nhwindow":
        return terminal.refresh();
    case "shim_clear_nhwindow":
        return clearWindow(args[0]);
    case "shim_yn_function":
        // terminal.log(`shim_yn_function: ${name} ${args}`);
        terminal.message(args[0]);
        return await getch();
    case "shim_putstr":
        // terminal.log(`shim_putstr: ${name} ${args}`);
        return terminal.message(args[2]);
    case "shim_putmsghistory":
    case "shim_raw_print":
        return terminal.message(args[0]);
    case "shim_message_menu":
        return 121; // 'y'
    case "shim_nhgetch":
    case "shim_nh_poskey":
        return await getch();
    case "shim_status_update":
        // terminal.log(`shim_status_update: ${name} ${args}`);
        return statusUpdate(... args);
    case "shim_start_menu":
        return menuStart();
    case "shim_select_menu":
        terminal.log(`MENU: ${name} ${args}`);
        break;
    case "shim_add_menu":
        terminal.log(`shim_add_menu: ${args}`);
        return menuAdd(... args);
    case "shim_end_menu":
        return menuEnd(... args);
    case "shim_curs":
        return moveCursor(... args);
    case "shim_player_selection":
    case "shim_destroy_nhwindow":
        // TODO, but not urgent
        return;
    case "shim_cliparound":
    case "shim_get_nh_event":
    case "shim_status_init":
        // ignore
        return;
    default:
        // terminal.log(`callback: ${name} ${args}`);
        return 0;
    }
}

async function getch() {
    let ch = await terminal.getInput();
    // terminal.log("ch: " + ch);

    // single character
    if (typeof ch === "string" && ch.length === 1) {
        process.stdout.write(ch);
        return ch.charCodeAt(0);
    }

    // special characters
    switch (ch) {
    case "LEFT": return "h".charCodeAt(0);
    case "RIGHT": return "l".charCodeAt(0);
    case "UP": return "k".charCodeAt(0);
    case "DOWN": return "j".charCodeAt(0);
    case "CTRL_A": return "a".charCodeAt(0) & 0x1F;
    case "CTRL_D": return "d".charCodeAt(0) & 0x1F;
    case "CTRL_P": return "p".charCodeAt(0) & 0x1F;
    case "CTRL_R": return "r".charCodeAt(0) & 0x1F;
    case "CTRL_T": return "t".charCodeAt(0) & 0x1F;
    case "CTRL_X": return "x".charCodeAt(0) & 0x1F;
    case "CTRL_Z": return "z".charCodeAt(0) & 0x1F;
    default:
        return 0x1B; // ESC
    }
}

async function delay(count) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, count);
    });
}

async function printGlyph(win, x, y, glyph, bkglyph) {
    let ret = globalThis.nethackGlobal.helpers.mapglyphHelper(glyph, x, y, 0);
    // console.log("ret", ret);
    // console.log("->>> ch", String.fromCharCode(ret.ch));
    terminal.mapGlyph(x, y, String.fromCharCode(ret.ch), bkglyph);
    return;
}

function clearWindow(winid) {
    if (winid === "WIN_MAP") return terminal.mapClear();
    if (winid === "WIN_INVEN") return terminal.clearInventory();
    if (winid === "WIN_MESSAGE") return; // ignore clearning the message window
    terminal.log("CLEAR WINDOW:", winid);
}

function moveCursor(winid, x, y) {
    if (winid === "WIN_MAP") terminal.mapCursor(x, y);
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
    if (type === "BL_GOLD") value = value.replace(/\\G[0-9A-Fa-f]{8}/gi, "$");


    if (type === "BL_RESET") {
        let firstLine = `${sm.get("BL_TITLE")}  St:${sm.get("BL_STR")} Dx:${sm.get("BL_DX")} Co:${sm.get("BL_CO")} In:${sm.get("BL_IN")} Wi:${sm.get("BL_WI")} Ch:${sm.get("BL_CH")} ${sm.get("BL_ALIGN")}`;
        let secondLine = `${sm.get("BL_LEVELDESC")}  ${sm.get("BL_GOLD")} HP:${sm.get("BL_HP")}(${sm.get("BL_HPMAX")}) Pw:${sm.get("BL_ENE")}(${sm.get("BL_ENEMAX")}) AC:${sm.get("BL_AC")} Xp:${sm.get("BL_XP")}`;
        terminal.setStats(firstLine, secondLine);
    }

    sm.set(type, value);
}

function menuStart(winid, mbehavior) {
    // console.log("START MENU");
    if (winid === "WIN_INVEN") terminal.clearInventory();
}

function menuAdd(winid, glyph, id, ch, gch, attr, str, itemflags) {
    if (winid === "WIN_INVEN") terminal.addInventory(`(${String.fromCharCode(ch)}) ${str}`);
}

function menuEnd(winid, prompt) {
    if (winid === "WIN_INVEN") terminal.showInventory(prompt);
}

// function menuSelect(winid, how, menulist) {
//     if(winid === "WIN_INVEN") terminal.addInventory(prompt);
// }

nethackStart(nethackShimCallback);

// (async function() {
//     await terminal.init();
//     menuAdd("WIN_INVEN", null, null, null, null, null, "test 1", null);
//     menuAdd("WIN_INVEN", null, null, null, null, null, "test 2", null);
//     menuAdd("WIN_INVEN", null, null, null, null, null, "test 3", null);
//     terminal.showInventory();
// }());
