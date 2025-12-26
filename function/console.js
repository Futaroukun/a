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

import chalk from 'chalk';
import moment from 'moment-timezone';

/**
 * Get current timestamp
 */
const getTimestamp = () => {
  return moment.tz('Asia/Jakarta').format('HH:mm:ss');
};

/**
 * Console logger dengan warna
 */
export const logger = {
  /**
   * Log info (hijau)
   */
  info: (message) => {
    console.log(
      chalk.bgGreen.black(` INFO `) +
      chalk.gray(` [${getTimestamp()}] `) +
      chalk.green(message)
    );
  },
  
  /**
   * Log success (hijau terang)
   */
  success: (message) => {
    console.log(
      chalk.bgGreenBright.black(` SUCCESS `) +
      chalk.gray(` [${getTimestamp()}] `) +
      chalk.greenBright(message)
    );
  },
  
  /**
   * Log error (merah)
   */
  error: (message, error = null) => {
    console.log(
      chalk.bgRed.white(` ERROR `) +
      chalk.gray(` [${getTimestamp()}] `) +
      chalk.red(message)
    );
    if (error) {
      console.log(chalk.red(`  ↳ ${error.message}`));
    }
  },
  
  /**
   * Log warning (kuning)
   */
  warn: (message) => {
    console.log(
      chalk.bgYellow.black(` WARN `) +
      chalk.gray(` [${getTimestamp()}] `) +
      chalk.yellow(message)
    );
  },
  
  /**
   * Log debug (biru)
   */
  debug: (message) => {
    console.log(
      chalk.bgBlue.white(` DEBUG `) +
      chalk.gray(` [${getTimestamp()}] `) +
      chalk.blue(message)
    );
  },
  
  /**
   * Log command execution (cyan)
   */
  cmd: (from, command, isGroup = false) => {
    const groupTag = isGroup ? chalk.bgCyan.black(' GROUP ') : chalk.bgMagenta.black(' PRIVATE ');
    console.log(
      groupTag +
      chalk.gray(` [${getTimestamp()}] `) +
      chalk.cyan(`Command: ${command}`) +
      chalk.gray(` | From: ${from}`)
    );
  },
  
  /**
   * Log plugin loaded (hijau)
   */
  plugin: (pluginName) => {
    console.log(
      chalk.bgGreen.black(` PLUGIN `) +
      chalk.gray(` [${getTimestamp()}] `) +
      chalk.green(`✓ ${pluginName}`)
    );
  },
  
  /**
   * Log plugin error (merah)
   */
  pluginError: (pluginName, error) => {
    console.log(
      chalk.bgRed.white(` PLUGIN `) +
      chalk.gray(` [${getTimestamp()}] `) +
      chalk.red(`✗ ${pluginName}`)
    );
    if (error) {
      console.log(chalk.red(`  ↳ ${error.message}`));
    }
  },
  
  /**
   * Log connection status
   */
  connection: (status, message) => {
    const colors = {
      connecting: chalk.yellow,
      open: chalk.green,
      close: chalk.red
    };
    
    const color = colors[status] || chalk.white;
    const statusTag = chalk.bgWhite.black(` CONNECTION `);
    
    console.log(
      statusTag +
      chalk.gray(` [${getTimestamp()}] `) +
      color(message)
    );
  },
  
  /**
   * Log QR Code
   */
  qr: () => {
    console.log(
      chalk.bgCyan.black(` QR CODE `) +
      chalk.gray(` [${getTimestamp()}] `) +
      chalk.cyan('Scan QR code dengan WhatsApp!')
    );
  },
  
  /**
   * Log pairing code
   */
  pairing: (code) => {
    console.log(
      chalk.bgMagenta.white(` PAIRING `) +
      chalk.gray(` [${getTimestamp()}] `) +
      chalk.magenta(`Kode: ${code}`)
    );
  },
  
  /**
   * Banner bot startup
   */
  banner: () => {
    console.clear();
    console.log(chalk.cyan(`
╔═══════════════════════════════════════╗
║                                       ║
║        🐺 SYAU WOLF BOT 🐺           ║
║                                       ║
║  Base WhatsApp Bot - Simple & Clean  ║
║  Created by: Syau Wolf               ║
║  YouTube: @syauwolf                  ║
║                                       ║
╚═══════════════════════════════════════╝
    `));
    console.log(chalk.gray(`Starting bot at ${getTimestamp()}...\n`));
  },
  
  /**
   * Custom log dengan warna sendiri
   */
  custom: (tag, message, color = 'white') => {
    const colorFn = chalk[color] || chalk.white;
    console.log(
      chalk.bgWhite.black(` ${tag} `) +
      chalk.gray(` [${getTimestamp()}] `) +
      colorFn(message)
    );
  },
  
  /**
   * Log message received
   */
  message: (from, text, isGroup) => {
    const type = isGroup ? chalk.bgCyan.black(' GROUP ') : chalk.bgMagenta.black(' PRIVATE ');
    const truncatedText = text.length > 50 ? text.substring(0, 50) + '...' : text;
    
    console.log(
      type +
      chalk.gray(` [${getTimestamp()}] `) +
      chalk.white(`From: ${from}`) +
      chalk.gray(` | Message: ${truncatedText}`)
    );
  }
};

/**
 * Export default
 */
export default logger;