/*

- Buatan Syau Wolf

Dilarang menjual, atau menghapus nama pembuat.
youtube: @syauwolf

Base Esm
Simple
Plugin
Base dasar

© Syau Wolf
*/

import {
makeWASocket,
DisconnectReason,
useMultiFileAuthState,
jidDecode
} from 'baileys';
import fs from 'fs';
import readline from 'readline';
import pino from 'pino';

let handlers = (await import('./syauwolf.mjs')).default;

const question = (text) => {
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
return new Promise((resolve) => { rl.question(text, resolve) });
}

async function connectToWhatsApp() {
const { state, saveCreds } = await useMultiFileAuthState('session')
const syau = makeWASocket({
logger: pino({ level: "silent" }),
auth: state,
printQRInTerminal: false,
browser: ['Ubuntu', 'Chrome', '20.0.04'],
});

if (!syau.authState.creds.registered) {
const IsiNomor = await question('Nomor: ');
let code = await syau.requestPairingCode(IsiNomor);
code = code?.match(/.{1,4}/g)?.join('-') || code;
console.log(`Kode :\n`, code);
};

syau.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect.error?.output.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        console.log("[ SYAU WOLF ] :\n MEMPERBARUI KONEKSI");
        ConnectToWhatsApp();
      }
    }
    if (connection === "open") {
      console.log("[ SYAU WOLF ]:\nKONEKSI TERHUBUNG");
      await syau.sendMessage('6285711882963@s.whatsapp.net', { text: 'KONEKSI BERHASIL\n\n*Bergabung ke grup ini untuk berkomunikasi dengan syau wolf mengenai base atau hal lainnya:* https://chat.whatsapp.com/BtFufKbHL9u3YEDoxJOAEa?mode=ems_copy_t\n\n© Syau Wolf'})
  }
});

syau.decodeJid = (jid) => {
if (!jid) return jid;
if (/:\d+@/gi.test(jid)) {
let decode = jidDecode(jid) || {};
return (
(decode.user && decode.server && decode.user + "@" + decode.server) ||
jid
);
} else return jid;
};

syau.ev.on('creds.update', saveCreds);

syau.ev.on('messages.upsert', async ({ messages }) => {
const m = messages[0];
if (!m) return m;
if (!m.message) return;
m.chat = m.key.remoteJid;
m.isGroup = m.chat.endsWith('@g.us');
m.sender = syau.decodeJid(m.key.participant || m.key.remoteJid);
await handlers(syau, m);
});
};

connectToWhatsApp();