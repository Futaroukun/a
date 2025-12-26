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
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers
} from '@whiskeysockets/baileys';
import fs from 'fs';
import readline from 'readline';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import logger from './function/console.js';

const messageHandler = (await import('./handler.js')).default;

const question = (text) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((resolve) => {
    rl.question(text, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
};

async function startBot() {
  logger.banner();
  
  const { state, saveCreds } = await useMultiFileAuthState('session');
  const { version, isLatest } = await fetchLatestBaileysVersion();
  
  logger.info(`Using WA v${version.join('.')}, isLatest: ${isLatest}`);
  
  const main = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    browser: Browsers.ubuntu('Syau Wolf Bot'),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
    },
    generateHighQualityLinkPreview: true,
    getMessage: async (key) => {
      if (main.store) {
        const msg = await main.store.loadMessage(key.remoteJid, key.id);
        return msg?.message || undefined;
      }
      return { conversation: 'Message not found' };
    }
  });
  
  // Pairing code atau QR
  if (!main.authState.creds.registered) {
    const usePairingCode = await question('Gunakan Pairing Code? (y/n): ');
    
    if (usePairingCode.toLowerCase() === 'y') {
      const phoneNumber = await question('Nomor (dengan kode negara, contoh: 628xxx): ');
      const code = await main.requestPairingCode(phoneNumber);
      logger.pairing(code);
    } else {
      // Generate QR Code di terminal
      main.ev.on('connection.update', (update) => {
        const { qr } = update;
        if (qr) {
          qrcode.generate(qr, { small: true });
          logger.qr();
        }
      });
    }
  }
  
  main.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    
    if (connection === "close") {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      
      logger.connection('close', `Koneksi tertutup: ${lastDisconnect?.error} | Reconnecting: ${shouldReconnect}`);
      
      if (shouldReconnect) {
        logger.warn("Memperbarui koneksi...");
        setTimeout(() => startBot(), 3000);
      }
    }
    
    if (connection === "open") {
      logger.connection('open', '✅ Koneksi terhubung!');
      await main.sendMessage('6283854551575@s.whatsapp.net', {
        text: '✅ *KONEKSI BERHASIL*\n\n_Bot Syau Wolf telah online!_\n\n*Bergabung ke grup untuk info lebih lanjut:*\nhttps://chat.whatsapp.com/BtFufKbHL9u3YEDoxJOAEa\n\n© Syau Wolf'
      });
    }
    
    if (connection === "connecting") {
      logger.connection('connecting', 'Menghubungkan...');
    }
  });
  
  // Helper functions
  main.decodeJid = (jid) => {
    if (!jid) return jid;
    if (/:\d+@/gi.test(jid)) {
      const [number, server] = jid.split('@');
      return number.split(':')[0] + '@' + server;
    }
    return jid;
  };
  
  main.getName = (jid, withoutContact = false) => {
    const id = main.decodeJid(jid);
    if (id.endsWith('@g.us')) {
      const groupMetadata = main.store?.groupMetadata?.[id];
      return groupMetadata?.subject || 'Unknown Group';
    } else {
      if (withoutContact) return id.replace(/@.+/, '');
      const contact = main.store?.contacts?.[id];
      return contact?.notify || contact?.name || id.replace(/@.+/, '');
    }
  };
  
  main.sendTextWithMentions = async (jid, text, quoted, options = {}) => {
    return main.sendMessage(jid, {
      text: text,
      mentions: [...text.matchAll(/@(\d+)/g)].map(v => v[1] + '@s.whatsapp.net'),
      ...options
    }, { quoted });
  };
  
  main.downloadMediaMessage = async (message) => {
    const quoted = message.msg || message;
    const mtype = Object.keys(quoted)[0];
    const stream = await downloadContentFromMessage(quoted, mtype.replace('Message', ''));
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }
    return buffer;
  };
  
  main.ev.on('creds.update', saveCreds);
  
  main.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    
    const m = messages[0];
    if (!m.message) return;
    
    m.chat = m.key.remoteJid;
    m.isGroup = m.chat.endsWith('@g.us');
    m.sender = main.decodeJid(m.key.participant || m.key.remoteJid);
    m.fromMe = m.key.fromMe;
    m.pushName = m.pushName || 'No Name';
    
    // Extract message type and content
    const mtype = Object.keys(m.message)[0];
    m.mtype = mtype;
    m.msg = m.message[mtype];
    
    await messageHandler(main, m);
  });
  
  // Group events
  main.ev.on('groups.update', async (updates) => {
    for (const update of updates) {
      const id = update.id;
      if (update.subject) {
        logger.debug(`Grup ${id} mengubah subject menjadi: ${update.subject}`);
      }
    }
  });
  
  main.ev.on('group-participants.update', async (update) => {
    logger.debug(`Participant update: ${JSON.stringify(update)}`);
    // Handle welcome/leave messages here
  });
  
  return main;
}

startBot();