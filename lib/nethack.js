const nethackStart = require("@neth4ck/neth4ck");
let terminal = require("./terminal");
const process = require("process");

process.on("exit", (... args) => {
    console.log("caught process exit:", args);
});

var winCount = 0;
var cbCount = 0;
async function nethackShimCallback(name, ... args) {
    let ch;

    switch(name) {
    case "shim_create_nhwindow":
        winCount++;
        // console.log("creating window", args, "returning", winCount);
        return winCount;
    case "shim_print_glyph":
        return await printGlyph(... args);
    case "shim_display_nhwindow":
        return terminal.refresh();
    case "shim_yn_function":
        terminal.log(`shim_yn_function: ${name} ${args}`);
        terminal.message(args[0]);
        return await getch();
    case "shim_putstr":
        terminal.log(`shim_yn_function: ${name} ${args}`);
        return terminal.message(args[2]);
    case "shim_raw_print":
        return terminal.message(args[0]);
    case "shim_message_menu":
        return 121; // 'y'
    case "shim_nhgetch":
    case "shim_nh_poskey":
        return await getch();
    case "shim_status_update":
        terminal.log(`shim_status_update: ${name} ${args}`);
        return terminal.statusUpdate(... args);
    case "shim_cliparound":
    case "shim_get_nh_event":
        // ignore
        return;
    default:
        terminal.log(`callback: ${name} ${args}`);
        return 0;
    }
}

async function getch() {
    return await terminal.getInput();
}

async function delay(count) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, count);
    });
}

async function printGlyph(win, x, y, glyph, bkglyph) {
    var ret = globalThis.nethackGlobal.helpers.mapglyphHelper(glyph, x, y, 0);
    // console.log("ret", ret);
    // console.log("->>> ch", String.fromCharCode(ret.ch));
    // await delay(3000);
    terminal.mapGlyph(x, y, String.fromCharCode(ret.ch), bkglyph);
    // await delay(3000);
    return;
}

terminal.init();
nethackStart(nethackShimCallback);
