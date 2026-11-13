// Builds the hardened game.html from game.src.html.
//   node tools/build.mjs          production: closed scope (IIFE) + obfuscation + script hash -> game.html
//   node tools/build.mjs --test   same logic but globals stay reachable for the test harness -> game.test.html (git-ignored)
import fs from 'node:fs';
import JavaScriptObfuscator from 'javascript-obfuscator';

const test = process.argv.includes('--test');
const dbg = process.argv.includes('--dbg');   // production layout + the reason of every trap trip written to sessionStorage (never committed)
const src = fs.readFileSync('game.src.html', 'utf8').replace(/\r\n/g, '\n');
const m = src.match(/<script data-h="dev">([\s\S]*?)<\/script>/);
if (!m) throw new Error('inline game script not found in game.src.html');

let code = m[1];
if (dbg) code = code.replace('if(why.length<30) why.push(r);', "if(why.length<30) why.push(r); try{ sessionStorage.setItem('ss_w',(sessionStorage.getItem('ss_w')||'')+r+','); }catch(e){}");
if (!test) code = '(function(){' + code + '\n})();';   // nothing in the game is reachable from the console

code = JavaScriptObfuscator.obfuscate(code, {
  target: 'browser',
  compact: true,
  simplify: true,
  identifierNamesGenerator: 'mangled-shuffled',   // short names keep the hot loops fast
  renameGlobals: false,
  stringArray: true,
  stringArrayEncoding: [],                        // plain lookups: base64 decoding in the draw loop cost ~35%
  stringArrayThreshold: 0.25,
  stringArrayCallsTransform: false,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  splitStrings: false,
  controlFlowFlattening: false,                   // too slow for a 60 fps loop
  deadCodeInjection: false,
  selfDefending: false,                           // can hang when the file is reformatted
  debugProtection: false,
  unicodeEscapeSequence: false,
  log: false,
}).getObfuscatedCode();

if (/<\/script|<!--/i.test(code)) throw new Error('obfuscated code contains a sequence that would break the script tag');

const fnv = (t) => { let h = 2166136261 >>> 0; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h.toString(16); };
const hash = test ? 'dev' : fnv(code);

const out = src.replace(m[0], '<script data-h="' + hash + '">' + code + '</script>');
const file = dbg ? 'game.dbg.html' : test ? 'game.test.html' : 'game.html';
fs.writeFileSync(file, out);
console.log('wrote', file, '(' + Math.round(out.length / 1024) + ' KB)', test ? 'test build' : 'hash ' + hash);
