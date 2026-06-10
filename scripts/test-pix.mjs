// scripts/test-pix.mjs — gera um PIX de TESTE direto na MasterPag (rode localmente).
// NÃO tem chave hardcoded: lê de variáveis de ambiente.
//
// Uso (PowerShell), com as chaves de TESTE:
//   $env:MASTERPAG_PUBLIC_KEY="pk_test_xxx"; $env:MASTERPAG_SECRET_KEY="sk_test_xxx"; node scripts/test-pix.mjs
//
// O "title" leva o NOME DO PRODUTO para o gate (aqui: "Oferta poderosa2").

const BASE = process.env.MASTERPAG_BASE_URL || 'https://api.masterpag.com/functions/v1';
const pub = process.env.MASTERPAG_PUBLIC_KEY;
const sec = process.env.MASTERPAG_SECRET_KEY;

if (!pub || !sec) {
  console.error('Defina MASTERPAG_PUBLIC_KEY e MASTERPAG_SECRET_KEY (use chaves de TESTE pk_test_/sk_test_).');
  process.exit(1);
}
if (sec.startsWith('sk_live_')) {
  console.error('Você está usando uma chave LIVE. Para teste, use sk_test_. Abortando por segurança.');
  process.exit(1);
}

const payload = {
  amount: 119.90,
  paymentMethod: 'pix',
  customer: {
    name: 'Cliente Teste',
    email: 'teste@exemplo.com',
    phone: '11999999999',
    document: { number: '12345678909', type: 'cpf' }
  },
  items: [
    { title: 'Oferta poderosa2', unitPrice: 119.90, quantity: 1, tangible: true }
  ]
};

const r = await fetch(`${BASE}/pix-receive`, {
  method: 'POST',
  headers: { 'x-public-key': pub, 'x-secret-key': sec, 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});

const data = await r.json().catch(() => ({}));
console.log('HTTP', r.status);
console.log(JSON.stringify(data, null, 2));

if (data && data.pix && data.pix.qrCode) {
  console.log('\n=== COMPROVANTE (PIX de teste) ===');
  console.log('Transaction ID:', data.id);
  console.log('Produto enviado ao gate:', payload.items[0].title);
  console.log('\nCOPIA-E-COLA:\n' + data.pix.qrCode);
  console.log('\nQR URL:\n' + (data.pix.qrCodeUrl || '(sem URL)'));
} else {
  console.log('\nNão veio QR. Veja o erro acima (chaves, unidade de amount, etc.).');
}
