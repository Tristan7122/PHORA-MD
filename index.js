const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers
} = require('@whiskeysockets/baileys')

const fs = require('fs')
const path = require('path')
const pino = require('pino')
const express = require('express')
const axios = require('axios')

const config = require('./config')
const { serialize } = require('./lib/serialize')
const { getBuffer } = require('./lib/myfunc')

// ===== OWNER =====
const ownerNumber = ['27634624586']
const ownerJid = ownerNumber.map(n => n + '@s.whatsapp.net')

// ===== AUTO REACTIONS =====
const AUTO_REACTIONS = [
  '😊','😂','🔥','💯','😎','🎉','👏','🙏','❤️','👍','🤖','👑'
]

// ===== KEEP ALIVE SERVER =====
const app = express()
app.get('/', (req, res) => res.send('Bot is running'))
app.listen(config.PORT || 3000)

// ===== MAIN =====
async function connectToWA () {
  const { state, saveCreds } = await useMultiFileAuthState('./session')
  const { version } = await fetchLatestBaileysVersion()

  const conn = makeWASocket({
    logger: pino({ level: 'silent' }),
    printQRInTerminal: true,
    auth: state,
    version,
    browser: Browsers.macOS('Chrome'),
    syncFullHistory: false
  })

  conn.ev.on('creds.update', saveCreds)

  conn.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update

    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode
      if (reason !== DisconnectReason.loggedOut) {
        console.log('Reconnecting...')
        setTimeout(connectToWA, 5000)
      }
    }

    if (connection === 'open') {
      console.log('Bot connected')

      const up = `🤖 *BOT CONNECTED*\n\n🕒 ${new Date().toLocaleString()}`
      await conn.sendMessage(ownerJid[0], {
        image: { url: 'https://files.catbox.moe/atby2t.png' },
        caption: up
      })
    }
  })

  // ===== MESSAGE HANDLER =====
  conn.ev.on('messages.upsert', async ({ messages }) => {
    try {
      const msg = messages[0]
      if (!msg.message) return

      const m = serialize(conn, msg)
      if (!m.message) return

      const senderNumber = m.sender.split('@')[0]
      const botNumber = conn.user.id.split(':')[0]
      const isOwner = ownerNumber.includes(senderNumber)
      const isReact = m.mtype === 'reactionMessage'

      // ===== REACTIONS =====
      if (!isReact && senderNumber !== botNumber) {

        // Owner reaction
        if (isOwner) {
          await m.react('🔓')
          return
        }

        // Custom react
        if (config.CUSTOM_REACT === 'true') {
          const reactions = (config.CUSTOM_REACT_EMOJIS || '🥲,👍🏻,🙂')
            .split(',')
            .map(e => e.trim())
          await m.react(reactions[Math.floor(Math.random() * reactions.length)])
          return
        }

        // Auto react
        if (config.AUTO_REACT === 'true') {
          await m.react(
            AUTO_REACTIONS[Math.floor(Math.random() * AUTO_REACTIONS.length)]
          )
        }
      }

      // ===== COMMAND HANDLER =====
      const pluginsDir = path.join(__dirname, 'plugins')
      const plugins = fs.readdirSync(pluginsDir).filter(f => f.endsWith('.js'))

      for (let file of plugins) {
        const plugin = require(path.join(pluginsDir, file))
        if (plugin.command && plugin.command.includes(m.command)) {
          await plugin.run(conn, m)
        }
      }

    } catch (err) {
      console.log(err)
    }
  })
}

connectToWA()
