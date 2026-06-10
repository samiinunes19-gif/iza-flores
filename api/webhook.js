// api/webhook.js — recebe notificações da MasterPag (charge.paid, charge.failed, ...).
// Precisamos do corpo BRUTO para validar a assinatura HMAC corretamente.
const crypto = require('crypto');

module.exports.config = { api: { bodyParser: false } };

function readRaw(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function hmacHex(secret, str) {
  return crypto.createHmac('sha256', secret).update(str).digest('hex');
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const raw = await readRaw(req);

  let payload = {};
  try { payload = JSON.parse(raw); } catch { return res.status(400).json({ error: 'JSON inválido' }); }

  // Validação de assinatura (recomendado). Defina MASTERPAG_WEBHOOK_SECRET.
  const secret = process.env.MASTERPAG_WEBHOOK_SECRET;
  if (secret) {
    const sig = String(req.headers['x-webhook-signature'] || '').replace('sha256=', '');
    // Tenta sobre o corpo bruto e, como fallback, sobre o JSON re-serializado
    // (a doc da MasterPag usa JSON.stringify(payload)).
    const candidates = [hmacHex(secret, raw), hmacHex(secret, JSON.stringify(payload))];
    const ok = candidates.some(exp =>
      sig.length === exp.length &&
      crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(exp, 'hex'))
    );
    if (!ok) return res.status(401).json({ error: 'Invalid signature' });
  }

  // Responda rápido (2xx) e processe depois. Aqui apenas registramos.
  // Como o site é estático (sem banco), a confirmação do pedido segue pelo WhatsApp;
  // este webhook serve para você automatizar/registrar quando quiser.
  const { event, data } = payload;
  console.log('[MasterPag webhook]', event, data && (data.transaction_id || data.id), data && data.status);

  return res.status(200).json({ received: true });
};
