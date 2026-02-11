const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys')

const P = require('pino')
const qrcode = require('qrcode-terminal')

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys')
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    logger: P({ level: 'silent' }),
    auth: state,
    version,
    printQRInTerminal: true
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', ({ connection }) => {
    if (connection === 'open') {
      console.log('✅ WhatsApp connected, session created!')
    }
  })
}

start()
