// api/pix-create.js — cria a cobrança PIX na MasterPag (autossuficiente).
// A chave secreta vem das Environment Variables da Vercel (nunca no frontend).
module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const pub = process.env.MASTERPAG_PUBLIC_KEY;
    const sec = process.env.MASTERPAG_SECRET_KEY;
    if (!pub || !sec) return res.status(500).json({ error: 'Chaves ausentes nas Environment Variables (MASTERPAG_PUBLIC_KEY / MASTERPAG_SECRET_KEY).' });

    const body = (req.body && typeof req.body === 'object') ? req.body : JSON.parse(req.body || '{}');
    const customer = body.customer || {};
    const items = Array.isArray(body.items) ? body.items : [];

    const total = items.reduce((s, it) => s + (Number(it.unitPrice) || 0) * Math.max(1, parseInt(it.quantity || 1, 10)), 0);

    const payload = {
      amount: Number(total.toFixed(2)),            // em reais (igual ao exemplo da doc)
      paymentMethod: 'pix',
      customer: {
        name: String(customer.name || ''),
        email: String(customer.email || ''),
        phone: String(customer.phone || '').replace(/\D/g, ''),
        document: {
          number: String((customer.document && customer.document.number) || '').replace(/\D/g, ''),
          type: 'cpf'
        }
      },
      items: items.map(it => ({
        title: String(it.title || 'Produto').slice(0, 120),   // NOME DO PRODUTO vai pro gate
        unitPrice: Number((Number(it.unitPrice) || 0).toFixed(2)),
        quantity: Math.max(1, parseInt(it.quantity || 1, 10)),
        tangible: true
      }))
    };

    const r = await fetch('https://api.masterpag.com/functions/v1/pix-receive', {
      method: 'POST',
      headers: { 'x-public-key': pub, 'x-secret-key': sec, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(r.status).json({ error: 'Gateway recusou', detail: data });

    // Procura o copia-e-cola em vários nomes possíveis (a doc é inconsistente).
    const qrCode = (data.pix && (data.pix.qrCode || data.pix.copyPaste || data.pix.emv)) || data.qrCode || data.pixCode || null;
    const qrCodeUrl = (data.pix && data.pix.qrCodeUrl) || data.qrCodeUrl || null;
    if (!qrCode) return res.status(502).json({ error: 'Resposta sem código PIX', detail: data });

    return res.status(200).json({ id: data.id, status: data.status, qrCode, qrCodeUrl });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Erro interno' });
  }
};
