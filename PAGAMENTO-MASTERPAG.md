# Integração PIX (MasterPag) — Monalisa Flores

PIX real via **funções serverless da Vercel**. A chave secreta fica **só no servidor**
(variável de ambiente), nunca no frontend. O frontend chama o **seu** backend, e o
backend chama a MasterPag.

```
Navegador  →  /api/pix-create  →  MasterPag /v1/pix-receive
Navegador  →  /api/pix-status  →  MasterPag /v1/pix-receive?transaction_id=...
MasterPag  →  /api/webhook      (charge.paid, charge.failed, ...)
```

## Arquivos
| Arquivo | Função |
|---|---|
| `api/_lib.js` | Helpers + leitura das chaves do ambiente (não é rota; prefixo `_`). |
| `api/pix-create.js` | `POST /api/pix-create` — cria o PIX. **Nome do produto vai em `items[].title`.** |
| `api/pix-status.js` | `GET /api/pix-status?transaction_id=...` — polling do status. |
| `api/webhook.js` | `POST /api/webhook` — recebe notificações (valida HMAC-SHA256). |
| `scripts/test-pix.mjs` | Gera um **PIX de teste** local (lê chaves do ambiente). |
| `.env.example` | Modelo das variáveis. **Nunca** commite o `.env` real. |

O frontend já foi ligado: o `cart.js` (`showPixScreen`) agora chama `/api/pix-create`,
mostra o QR + copia-e-cola reais e faz polling em `/api/pix-status`.

---

## ⚠️ ANTES DE TUDO: rotacione a chave
A `sk_live_` que você colou no chat está **exposta**. Vá em **Configurações → Chaves API**,
**gere uma nova chave secreta** e descarte a antiga. Só use a nova.

---

## Passo a passo (deploy na Vercel)

1. **Suba o projeto na Vercel** (importe a pasta / repositório). O site estático é servido
   na raiz e a pasta `api/` vira funções automaticamente.

2. **Defina as Environment Variables** (Project → Settings → Environment Variables):
   - `MASTERPAG_PUBLIC_KEY` = sua chave pública
   - `MASTERPAG_SECRET_KEY` = sua chave secreta **(a nova, rotacionada)**
   - `MASTERPAG_WEBHOOK_SECRET` = (opcional) segredo do webhook
   - `MASTERPAG_WEBHOOK_URL` = (opcional) `https://SEU-SITE.vercel.app/api/webhook`

   > Comece com as chaves de **TESTE** (`pk_test_`/`sk_test_`). Só troque para `live`
   > quando o teste passar.

3. **Configure o webhook** no painel da MasterPag apontando para
   `https://SEU-SITE.vercel.app/api/webhook` (eventos `charge.paid`, `charge.failed`).

4. **Pronto.** No checkout do site, ao escolher PIX e confirmar, o QR e o copia-e-cola
   vêm da MasterPag de verdade, e a tela atualiza sozinha quando o pagamento cai.

---

## Gerar um PIX de teste (comprovante)

Com **chaves de TESTE**, rode localmente (precisa do Node 18+ instalado):

```powershell
$env:MASTERPAG_PUBLIC_KEY="pk_test_xxx"
$env:MASTERPAG_SECRET_KEY="sk_test_xxx"
node scripts/test-pix.mjs
```

Ele imprime o `transaction_id`, o **copia-e-cola** e a **URL do QR** — esse é o comprovante.
O `title` enviado é **"Oferta poderosa2"**, provando que o nome do produto chega ao gate.

---

## Observações importantes

- **Unidade do `amount`:** a doc se contradiz (tabela diz "centavos"; o exemplo envia "reais").
  Comecei em **reais** (igual ao exemplo). Se o valor cobrado vier errado no 1º teste, troque
  `AMOUNT_UNIT` para `'centavos'` em `api/pix-create.js`.
- **Cartão:** continua exibindo "indisponível" e caindo no PIX. Posso integrar
  `/v1/card-receive` (com tokenização) depois, se quiser.
- **Saque/cashout (`/v1/api-withdrawal`):** NÃO foi exposto no site (seria perigosíssimo).
  Use só pelo painel.
- **Local (sem Vercel):** rodando pelo `ABRIR-SITE.bat`/servidor estático não existe `/api`,
  então o PIX mostra "não foi possível gerar" e cai no WhatsApp. Isso é esperado — o PIX real
  só funciona publicado na Vercel (ou via `vercel dev`).
