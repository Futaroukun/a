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

import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const __filename = fileURLToPath(import.meta.url);

export default async (syau, m) => {
if (!m || typeof m !== 'object' || !m.key || typeof m.key !== 'object') return;
let body = '';
if (m.message) {
body =
m.message.conversation ||
m.message.imageMessage?.caption ||
m.message.videoMessage?.caption ||
m.message.extendedTextMessage?.text ||
m.text || '';
};

const budy = (typeof m.text === 'string') ? m.text : '';
const args = body.trim().split(/ +/).slice(1)
const text = args.join(' ')
const prefixRegex = /^[/]/;
const prefix = prefixRegex.test(body) ? body.match(prefixRegex)[0] : '.';
const isCmd = body.startsWith(prefix);
const command = isCmd ? body.slice(prefix.length).trim().split(' ').shift().toLowerCase() : '';

async function reply(txt) {
const sywolf = {  
contextInfo: {
externalAdReply: {
title: `Syau Wolf`,
body: ``,
thumbnail: fs.readFileSync('./image.jpg'),
},
}, text: txt,
}
return syau.sendMessage(m.chat, sywolf)
};

    const pluginsLoader = async (directory) => {
    let plugins = [];

    if (!fs.existsSync(directory)) {
        console.warn(`Plugin direktori tidak di temukan: ${directory}`);
        return [];
    }

    const items = fs.readdirSync(directory, { withFileTypes: true });

    for (const item of items) {
        const fullPath = path.join(directory, item.name);
        if (item.isDirectory()) {
            plugins = plugins.concat(await pluginsLoader(fullPath));
        } else if (item.isFile() && item.name.endsWith('.mjs')) {
            try {
                const module = await import(`file://${fullPath}?v=${Date.now()}`);
                const plugin = module.default; 
                
                if (plugin) {
                    plugins.push(plugin);
                } else {
                     console.log(`Plugin  ${fullPath} tidak memiliki export default.`);
                }
            } catch (error) {
                console.log(`Error loading plugin ${fullPath}:`, error);
            }
        }
    }
    return plugins;
};

const pluginDir = path.resolve(__dirname, './plugin');

const pluginWatchers = new Map();

function watchPluginsDirectory() {
  if (!fs.existsSync(pluginDir)) {
    console.warn(`❌ Folder plugin tidak ditemukan: ${pluginDir}`);
    return;
  }

  const files = fs.readdirSync(pluginDir).filter(f => f.endsWith('.mjs'));

  for (const file of files) {
    const fullPath = path.join(pluginDir, file);

    if (pluginWatchers.has(fullPath)) continue;

    const watcher = fs.watch(fullPath, async (eventType) => {
      if (eventType === 'change') {
        console.log(`🔄 Plugin berubah: ${file}`);

        try {
          const updated = await import(`file://${fullPath}?update=${Date.now()}`);
          const plugin = updated.default;

          console.log(`✅ Plugin ${file} berhasil dimuat ulang`);
        } catch (e) {
          console.error(`❌ Gagal reload plugin ${file}:`, e);
        }
      }
    });

    pluginWatchers.set(fullPath, watcher);
  }
};

let pluginsDisable = true;
const plugins = await pluginsLoader(path.resolve(__dirname, "plugin"));
watchPluginsDirectory();

const PLUGIN_SYAU = {
        syau,
        prefix,
        command,
        reply,
        text,
        isGroup: m.isGroup,
        args,
        isCmd
};

for (const plugin of plugins) {
    if (plugin && typeof plugin.command?.find === 'function' && plugin.command.find((e) => e.toLowerCase() === command)) {
        pluginsDisable = false;
        
        if (typeof plugin !== "function") {
            console.error(`Plugin dari command '${command}' bukan sebuah function.`);
            continue;
        }

        try {
            await plugin(m, PLUGIN_SYAU);
        } catch (e) {
            console.error(`Error saat akan eksekusi command: ${command}`, e);
            await reply(`Terjadi error pada command ${command}:\n${e.message}`);
        }        
        return;
    }
}
if (!pluginsDisable) return;
}

fs.watchFile(__filename, () => {
  fs.unwatchFile(__filename);
  console.log(`Memperbarui ${__filename}`);
  import(`${import.meta.url}?update=${Date.now()}`);
});