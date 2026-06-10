# 🌸 Monalisa Flores — Documentação Completa do Site

Site de e-commerce (floricultura) **100% estático** — feito apenas com **HTML + CSS + JavaScript puro** (sem framework, sem backend, sem build). Basta extrair e servir os arquivos.

---

## 1. Como rodar (passo a passo)

O site precisa ser servido por um **servidor HTTP local** (não abra direto com `file://`, pois alguns navegadores bloqueiam scripts locais).

### Opção A — Python (recomendado, já vem no Windows/Mac/Linux)
1. Extraia o `.rar` numa pasta (ex.: `monalisa-flores`).
2. Abra o terminal **dentro dessa pasta**.
3. Rode:
   ```
   py -m http.server 8765
   ```
   (no Mac/Linux use `python3 -m http.server 8765`)
4. Abra no navegador: **http://localhost:8765**

### Opção B — Qualquer servidor estático
- VS Code com a extensão **Live Server** (botão "Go Live").
- `npx serve` (se tiver Node).
- Qualquer hospedagem estática (Netlify, Vercel, GitHub Pages, etc.) — basta subir a pasta.

> ⚠️ **Cache:** se alterar arquivos e não ver a mudança, dê **Ctrl + Shift + R** (recarregar forçado). O `index.html` já tem meta tags `no-cache`.

---

## 2. Estrutura de arquivos

| Arquivo | O que é |
|---|---|
| **index.html** | Página principal (estrutura HTML, header, banner, faixas, seções, modais de detalhe/categoria/cidades, cookie, e a bolinha flutuante "Loja aberta"). Carrega todos os scripts e o CSS. |
| **style.css** | Todo o estilo do site (cores, layout, hero, categorias, cards, faixas, busca, menu lateral, página de detalhe, etc.). |
| **products-data.js** | Banco de produtos base (`window.PRODUCTS_DATA`) — produtos originais. |
| **extra-products.js** | Produtos extras (importados de Giuliana Flores, Isabela Flores, Caneca Curitiba, Uniflores, Apaixonados por Pelúcia). Faz `push` em `PRODUCTS_DATA`. |
| **script.js** | Lógica principal: categorias, renderização das seções, navegação (SPA), busca, página de detalhe, carrossel do banner, normalização de preços (terminam em ,90), limpeza de descrição, bolinha "Loja aberta", reposicionamento das categorias. |
| **cart.js** | Carrinho completo: modal de produto, adicionais, cartão de mensagem, cartão premium, upsell, carrinho lateral, checkout (2 etapas), PIX, agendamento, customizador de camiseta. |
| **view-toggle.js** | Alternador de visualização **PC / Celular**. |
| **drag-scroll.js** | Arraste suave (com inércia) dos carrosséis de produtos no desktop. |
| **banner-hero*.png** | Imagens do banner principal (3 slides do carrossel). |
| **Demais .png** | Imagens locais auxiliares (buquês, cestas, etc.). |
| **products.json** | Dados legados de referência (NÃO é carregado pelo site). |
| **DOCUMENTACAO.md** | Este arquivo. |

### Ordem de carregamento (no fim do `index.html`)
```html
<script src="products-data.js"></script>   <!-- define PRODUCTS_DATA -->
<script src="extra-products.js"></script>   <!-- adiciona mais produtos -->
<script src="script.js"></script>           <!-- monta a home + lógica -->
<script src="cart.js"></script>             <!-- carrinho/checkout -->
<script src="view-toggle.js"></script>      <!-- PC/Celular -->
<script src="drag-scroll.js"></script>      <!-- arraste dos cards -->
```
Os parâmetros `?v=NN` nos `<script>`/`<link>` são apenas **cache-busting** (pode ignorar/atualizar).

---

## 3. Catálogo de produtos (itens)

- **~508 produtos** ativos em **14 categorias**.
- Cada produto é um objeto JS com:
  ```js
  { id, category_id, active, price, old_price, name, image, label_text, label_bg, label_color, description }
  ```
- Os **preços** são normalizados em tempo de carregamento para terminar em **,90** (em `script.js`).

### Categorias (ordem que aparecem) e `category_id`
| Ordem | Categoria | id |
|---|---|---|
| 1 | Dia dos Namorados | 31 |
| 2 | Flores + Chocolate | 27 |
| 3 | Buquês de Rosas | 25 |
| 4 | Kits Especiais | 23 |
| 5 | Cestas Românticas | 22 |
| — | Ursinho | 32 |
| — | Café da Manhã | 19 |
| — | Buquê + Presente | 21 |
| — | Arranjos em Vaso | 26 |
| — | Para Homens | 24 |
| — | Rosas Encantadas | 28 |
| — | Flores Plantadas | 29 |
| — | Café Saudável | 20 |
| — | Flores Silvestres | 30 |

> A lista de categorias fica no topo do **script.js** (`const CATEGORIES = [...]`). Para reordenar, mover/editar os itens dessa lista.

### ➕ Como adicionar um produto novo
Adicione um objeto no array dentro de **extra-products.js** (antes do `];` final), por exemplo:
```js
{ id: 9999, category_id: 25, active: 1, price: "99.90", old_price: "129.90",
  name: "Buquê Exemplo",
  image: "https://url-da-imagem.jpg",
  label_text: null, label_bg: "#dcfce7", label_color: "#166634",
  description: "Descrição do produto. Entrega rápida." },
```
- Use um `id` **único** (não repetir).
- `category_id` define em qual categoria aparece.

---

## 4. Imagens

- **Imagens locais** (incluídas no pacote): os banners do topo (`banner-hero*.png`) e alguns PNGs auxiliares.
- **Imagens dos produtos**: são **hotlinkadas** (carregadas por URL) de CDNs externos:
  - `static.giulianaflores.com.br`
  - `www.isabelaflores.com`
  - `www.canecacuritiba.com.br`
  - `www.uniflores.com.br`
  - `apaixonadosporpelucia.cdn.magazord.com.br`
  - `cdn.shopify.com`, `acdn-us.mitiendanube.com`, `cdn.awsli.com.br`

> ⚠️ **Importante:** como as fotos dos produtos vêm da internet, é preciso estar **online** para vê-las. Se um CDN sair do ar, a imagem específica não carrega (o card mostra um fundo cinza). As URLs ficam no campo `image:` de cada produto.

---

## 5. Funções / Recursos do site

### Página principal
- **Header** com logo, busca e carrinho (com badge de quantidade).
- **Barra "Entregamos hoje em sua região!"** (vermelha).
- **Banner carrossel** (3 slides, auto-rotativo, com swipe).
- **Bolinha flutuante "Loja aberta"** 🟢 — fixa, segue o cliente ao rolar, pisca, e ao clicar mostra um aviso. Aparece só na home.
- **Bloco "Dia dos Namorados"** com faixa vermelha de destaque (camisetas personalizadas aparecem primeiro).
- **"Confira nossas categorias"** + fileira de categorias (círculos com imagem).
- Seções de produtos por categoria (carrossel horizontal com **arraste suave**).
- **Selo "Promoção"** vermelho em todos os cards + botão **"Comprar agora"** vermelho alinhado.
- Features (Entrega Rápida, Frete Grátis, 3x Sem Juros, Compra Segura), termos populares, palavras buscadas, rodapé.

### Busca
- Ao clicar na busca: lista **todas as 14 categorias** (nome + imagem).
- Ao digitar (2+ letras): filtra os **produtos** por nome/descrição.

### Menu lateral (☰)
- Lista de categorias com ícone, clicáveis.

### Página de detalhe do produto
- Imagem, preço (verde), preço antigo, descrição, "Entrega rápida disponível na sua região" (borda verde).
- Botão **"Adicionar ao Carrinho"** (vermelho).

### Modal de produto / Adicionais
- Quantidade, lista de **Adicionais** (cartão grátis, foto via WhatsApp, cartão premium, laço, embalagem, **balão de coração com escolha de cor**, mini buquê, e chocolates: **Ferrero Rocher 4/8/12 un, Caixa de Bombom Garoto, Raffaello**).
- **Cartão de Declaração** (modal com modelos de mensagem) e **Cartão Premium** (modal com tipos de papel).
- Campo de **Observações**.

### Upsell ("Que tal alguns adicionais?")
- Mostra **2 flores com chocolate** + **2 ursinhos "com coração"** de menor valor.

### Carrinho + Checkout (2 etapas)
- Carrinho lateral, mínimo de pedido, badge.
- **Etapa 1 — Dados de entrega:** nome, telefone, email, CEP (busca automática), endereço. Validação **inline** (mensagem vermelha embaixo do campo, sem emojis).
- **Etapa 2 — Pagamento:** **CPF do Comprador**, opções de entrega (Hoje / Rápida R$5,89 / **Agendar** — data com mínimo = hoje, sem dias passados), forma de pagamento **PIX** ou **Cartão**.
- **Cartão:** ao confirmar, exibe modal **"Pagamento Temporariamente Indisponível"** e redireciona para o **PIX**.
- **PIX:** gera código/QR (demonstração) e botão para enviar pedido por **WhatsApp**.
- Ícone de **lápis** para editar o endereço.

### Customizações
- **Camiseta personalizada** (cor, tamanho, upload de foto) — produtos com `is_tshirt`.

### Outros
- **Alternador PC / Celular** (botão flutuante à direita).
- **Banner de cookies** (LGPD).
- Tudo **responsivo** e pensado para **mobile** (coluna de 430px centralizada).

---

## 6. Cores principais (identidade)
| Uso | Cor |
|---|---|
| Vermelho (marca/botões/faixas) | `#e30613` |
| Vermelho escuro (hover) | `#c10510` |
| Verde (preços/Loja aberta) | `#16a34a` |
| Logo (cursiva) | `#c1121f` / `#e63946` |

---

## 7. Subir em outra conta do Claude (passo a passo)
1. Extraia o `.rar`.
2. Suba a pasta extraída (todos os arquivos) para a outra conta/ambiente.
3. Rode um servidor estático na pasta (ver **Seção 1**): `py -m http.server 8765`.
4. Abra `http://localhost:8765`.
5. Pronto — o site fica **idêntico** (mesmos produtos, funções e layout). Só precisa de **internet** para as fotos dos produtos.

---

## 8. Observações importantes
- **Sem backend:** o pagamento (PIX/cartão) é **demonstrativo** — o pedido é enviado por WhatsApp; não há cobrança real nem banco de dados.
- **Sem instalação/dependências:** é HTML/CSS/JS puro. Não precisa de `npm install`.
- **Não precisa das pastas `amor_backup` / `backup_maio`** (eram projetos Next.js de referência) — elas **não** fazem parte deste site e não estão neste pacote.
- Para editar produtos/categorias/textos, basta abrir os arquivos `.js` num editor de texto.

---

*Monalisa Flores — pacote gerado para distribuição. Bom uso! 🌹*
