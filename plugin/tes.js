const handler = async (m, { main, reply, react, text, args }) => {
  await react('✅');
  await reply(`✅ *Bot is Online!*

📱 *Info:*
• Command: ${m.command || 'tes'}
• Sender: @${m.sender.split('@')[0]}
• Group: ${m.isGroup ? 'Yes' : 'No'}

🔥 *Syau Wolf Bot Active!*`);
};

handler.command = ['tes', 'test', 'ping'];
handler.tags = ['info'];
handler.help = ['tes', 'test', 'ping'];

export default handler;