// api/pix-status.js — consulta o status da transação (confirmação automática). Autossuficiente.
module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const pub = process.env.MASTERPAG_PUBLIC_KEY;
  const sec = process.env.MASTERPAG_SECRET_KEY;
  if (!pub || !sec) return res.status(500).json({ error: 'Chaves ausentes nas Environment Variables.' });

  const id = (req.query && (req.query.transaction_id || req.query.id)) || '';
  if (!id) return res.status(400).json({ error: 'transaction_id obrigatório' });

  try {
    const r = await fetch('https://api.masterpag.com/functions/v1/pix-receive?transaction_id=' + encodeURIComponent(id), {
      method: 'GET',
      headers: { 'x-public-key': pub, 'x-secret-key': sec }
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return res.status(r.status).json({ error: 'Falha ao consultar', detail: data });
    const t = data.transaction || data;
    return res.status(200).json({ id: t.id, status: t.status, paidAt: t.paid_at || null });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Erro interno' });
  }
};
