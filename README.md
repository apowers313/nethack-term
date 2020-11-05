## About
This is a proof of concept showing how the WASM flavor of NetHack works. Presumably this can be ported to the browser as well. There are two files in this demo:
1. `lib/nethack.js` - implements the [NetHack shim callback](https://www.npmjs.com/package/@neth4ck/neth4ck) and all the supporting logic needed to run the game
2. `lib/terminal.js` - implements the terminal UI based on [terminal-kit](https://github.com/cronvel/terminal-kit). Anyone interested in creating a browser port could theoretically replace this with their favorite browser front-end.

## Installing
``` bash
git clone https://github.com/apowers313/nethack-term
cd nethack-term
npm install
```

## Running
``` bash
node index.js
```