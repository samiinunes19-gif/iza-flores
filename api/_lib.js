// api/_lib.js — utilitários compartilhados.
// O prefixo "_" faz a Vercel NÃO tratar este arquivo como rota.
// A chave secreta vive SÓ aqui (no servidor), lida de variável de ambiente.

const BASE_URL = process.env.MASTERPAG_BASE_URL || 'https://api.masterpag.com/functions/v1';

function getKeys() {
  const pub = process.env.MASTERPAG_PUBLIC_KEY;
  const sec = process.env.MASTERPAG_SECRET_KEY;
  if (!pub || !sec) {
    throw new Error('Chaves MasterPag ausentes. Defina MASTERPAG_PUBLIC_KEY e MASTERPAG_SECRET_KEY nas Environment Variables da Vercel.');
  }
  return { pub, sec };
}

function authHeaders() {
  const { pub, sec } = getKeys();
  return {
    'x-public-key': pub,
    'x-secret-key': sec,
    'Content-Type': 'application/json'
  };
}

// O site e a API ficam no MESMO domínio na Vercel → CORS não é necessário.
// Mantido caso você hospede o front em outro domínio (defina CORS_ORIGIN).
function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

module.exports = { BASE_URL, getKeys, authHeaders, setCors, readJson };
