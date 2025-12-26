import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { 
  downloadContentFromMessage,
  generateWAMessageFromContent,
  proto
} from '@whiskeysockets/baileys';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const __filename = fileURLToPath(import.meta.url);

const pluginWatchers = new Map();

/**
 * Load all plugins from directory recursively
 */
const loadPlugins = async (directory) => {
  let plugins = [];

  if (!fs.existsSync(directory)) {
    console.warn(`Plugin direktori tidak ditemukan: ${directory}`);
    return [];
  }

  const items = fs.readdirSync(directory, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(directory, item.name);
    
    if (item.isDirectory()) {
      plugins = plugins.concat(await loadPlugins(fullPath));
    } else if (item.isFile() && item.name.endsWith('.js')) {
      try {
        const module = await import(`file://${fullPath}?v=${Date.now()}`);
        const plugin = module.default;

        if (plugin) {
          plugins.push(plugin);
          console.log(`✅ Plugin loaded: ${item.name}`);
        } else {
          console.log(`⚠️ Plugin ${fullPath} tidak memiliki export default.`);
        }
      } catch (error) {
        console.log(`❌ Error loading plugin ${fullPath}:`, error);
      }
    }
  }
  return plugins;
};

/**
 * Watch plugin directory for changes
 */
const watchPlugins = (pluginDir) => {
  if (!fs.existsSync(pluginDir)) {
    console.warn(`❌ Folder plugin tidak ditemukan: ${pluginDir}`);
    return;
  }

  const files = fs.readdirSync(pluginDir).filter(f => f.endsWith('.js'));

  for (const file of files) {
    const fullPath = path.join(pluginDir, file);

    if (pluginWatchers.has(fullPath)) continue;

    const watcher = fs.watch(fullPath, async (eventType) => {
      if (eventType === 'change') {
        console.log(`🔄 Plugin berubah: ${file}`);

        try {
          await import(`file://${fullPath}?update=${Date.now()}`);
          console.log(`✅ Plugin ${file} berhasil dimuat ulang`);
        } catch (e) {
          console.error(`❌ Gagal reload plugin ${file}:`, e);
        }
      }
    });

    pluginWatchers.set(fullPath, watcher);
  }
};

/**
 * Main message handler
 */
export default async (main, m) => {
  try {
    if (!m || typeof m !== 'object' || !m.key || typeof m.key !== 'object') return;

    let body = '';
    const mtype = m.mtype;
    
    if (m.message) {
      body =
        m.message.conversation ||
        m.message.imageMessage?.caption ||
        m.message.videoMessage?.caption ||
        m.message.documentMessage?.caption ||
        m.message.extendedTextMessage?.text ||
        '';
    }

    const budy = body;
    const args = body.trim().split(/ +/).slice(1);
    const text = args.join(' ');
    const prefixRegex = /^[/.!#]/;
    const prefix = prefixRegex.test(body) ? body.match(prefixRegex)[0] : '.';
    const isCmd = body.startsWith(prefix);
    const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : '';

    // Quoted message
    const quoted = m.msg?.contextInfo?.quotedMessage ? m.msg.contextInfo.quotedMessage : null;
    const isQuoted = quoted !== null;

    /**
     * Reply function with context
     */
    const reply = async (txt) => {
      return main.sendMessage(m.chat, { text: txt }, { quoted: m });
    };

    /**
     * Send image with caption
     */
    const sendImage = async (jid, buffer, caption = '', options = {}) => {
      return main.sendMessage(jid, { 
        image: buffer, 
        caption: caption,
        ...options 
      });
    };

    /**
     * Send video with caption
     */
    const sendVideo = async (jid, buffer, caption = '', options = {}) => {
      return main.sendMessage(jid, { 
        video: buffer, 
        caption: caption,
        ...options 
      });
    };

    /**
     * Send audio
     */
    const sendAudio = async (jid, buffer, options = {}) => {
      return main.sendMessage(jid, { 
        audio: buffer, 
        mimetype: 'audio/mp4',
        ...options 
      });
    };

    /**
     * Send sticker
     */
    const sendSticker = async (jid, buffer, options = {}) => {
      return main.sendMessage(jid, { 
        sticker: buffer,
        ...options 
      });
    };

    /**
     * Download media from message
     */
    const downloadMedia = async () => {
      const quoted = m.msg || m;
      const type = Object.keys(quoted)[0];
      const msg = quoted[type];
      
      if (!msg) throw new Error('No media message found');
      
      const stream = await downloadContentFromMessage(msg, type.replace('Message', ''));
      let buffer = Buffer.from([]);
      
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }
      
      return buffer;
    };

    /**
     * React to message
     */
    const react = async (emoji) => {
      return main.sendMessage(m.chat, {
        react: {
          text: emoji,
          key: m.key
        }
      });
    };

    /**
     * Send buttons (new format)
     */
    const sendButton = async (jid, text, buttons = [], footer = '') => {
      const templateButtons = buttons.map((btn, index) => ({
        index: index + 1,
        quickReplyButton: {
          displayText: btn.displayText,
          id: btn.id
        }
      }));

      const templateMessage = {
        text: text,
        footer: footer,
        templateButtons: templateButtons
      };

      return main.sendMessage(jid, templateMessage);
    };

    /**
     * Send list message
     */
    const sendList = async (jid, text, footer, buttonText, sections) => {
      const listMessage = {
        text: text,
        footer: footer,
        buttonText: buttonText,
        sections: sections
      };

      return main.sendMessage(jid, listMessage);
    };

    const pluginDir = path.resolve(__dirname, './plugin');
    
    // Load plugins
    const plugins = await loadPlugins(pluginDir);
    
    // Watch for plugin changes
    watchPlugins(pluginDir);

    // Plugin context
    const ctx = {
      main,
      m,
      prefix,
      command,
      args,
      text,
      body,
      budy,
      isGroup: m.isGroup,
      isCmd,
      sender: m.sender,
      chat: m.chat,
      pushName: m.pushName,
      isQuoted,
      quoted,
      mtype,
      // Functions
      reply,
      sendImage,
      sendVideo,
      sendAudio,
      sendSticker,
      downloadMedia,
      react,
      sendButton,
      sendList
    };

    let pluginExecuted = false;

    // Execute matching plugin
    for (const plugin of plugins) {
      if (plugin && 
          typeof plugin.command?.find === 'function' && 
          plugin.command.find((e) => e.toLowerCase() === command)) {
        
        pluginExecuted = true;

        if (typeof plugin !== "function") {
          console.error(`Plugin dari command '${command}' bukan sebuah function.`);
          continue;
        }

        try {
          await plugin(m, ctx);
        } catch (e) {
          console.error(`Error saat eksekusi command: ${command}`, e);
          await reply(`❌ Terjadi error pada command ${command}:\n${e.message}`);
        }
        break;
      }
    }

    if (pluginExecuted) return;
    
  } catch (error) {
    console.error('Error in message handler:', error);
  }
};

// Watch this file for changes
fs.watchFile(__filename, () => {
  fs.unwatchFile(__filename);
  console.log(`🔄 Memperbarui ${__filename}`);
  import(`${import.meta.url}?update=${Date.now()}`);
});