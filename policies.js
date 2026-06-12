/* Páginas de políticas reais (marketplace) — abrem em URLs próprias para o
   Google entender o modelo de negócio e atender às normas do Google Ads. */
(function () {
  'use strict';

  // Dados administrativos reais (sede da empresa) — identificação exigida pelo Google Ads:
  var EMPRESA = {
    nome: 'Floricultura Ana e Amores',
    razao: 'Floricultura Ana e Amores',
    cnpj: '49.684.515/0001-47',
    email: 'contato@floricultura-dosamores.sbs',
    whatsapp: '(27) 99978-5632',
    endereco: 'Avenida Guacuí, 1320 — Bairro Araçá, Linhares/ES — CEP 29901-394',
    cidade: 'Linhares — ES'
  };

  var INTRO_MARKETPLACE =
    '<p>A <strong>' + EMPRESA.nome + '</strong> é um <strong>marketplace de flores e presentes</strong> que conecta você às ' +
    '<strong>melhores floriculturas locais de cada região do Brasil</strong>. Não mantemos estoque próprio: ao receber o seu pedido, ' +
    'nós o encaminhamos para uma <strong>floricultura parceira selecionada</strong>, a mais próxima do endereço de entrega. ' +
    'Assim garantimos <strong>flores frescas</strong>, <strong>entrega rápida</strong> (muitas vezes no mesmo dia) e cobertura em ' +
    '<strong>diversas cidades e estados</strong> — sempre com a qualidade de quem é especialista em flores na sua região.</p>';

  var POLICIES = {
    'quem-somos': {
      title: 'Quem Somos',
      html: INTRO_MARKETPLACE +
        '<p>Funcionamos como um <strong>intermediador</strong>: você escolhe o presente, realiza o pagamento de forma segura e nós ' +
        'acionamos a floricultura parceira responsável por preparar e entregar o pedido na sua região. Dessa forma, valorizamos o ' +
        'comércio local e conseguimos atender clientes em todo o país.</p>' +
        '<p><strong>Empresa:</strong> ' + EMPRESA.razao + '<br><strong>CNPJ:</strong> ' + EMPRESA.cnpj +
        '<br><strong>Sede:</strong> ' + EMPRESA.endereco +
        '<br><strong>Contato:</strong> ' + EMPRESA.email + ' · WhatsApp ' + EMPRESA.whatsapp + '</p>'
    },
    'termos-de-uso': {
      title: 'Termos de Uso',
      html:
        '<p>Bem-vindo à ' + EMPRESA.nome + '. Ao utilizar nosso site e realizar pedidos, você concorda com estes Termos.</p>' +
        '<h3>1. Sobre o serviço</h3>' + INTRO_MARKETPLACE +
        '<h3>2. Pedidos e pagamentos</h3><p>Os preços e a disponibilidade são exibidos no momento da compra. O pagamento é processado ' +
        'de forma segura (PIX ou cartão). A confirmação do pedido ocorre após a aprovação do pagamento.</p>' +
        '<h3>3. Entrega</h3><p>A preparação e a entrega são realizadas pela floricultura parceira da sua região. Os prazos podem variar ' +
        'conforme a localidade, a disponibilidade e a confirmação do pagamento. Produtos podem sofrer pequenas variações em relação às ' +
        'imagens, mantendo o padrão e o valor contratados.</p>' +
        '<h3>4. Responsabilidades</h3><p>Atuamos como intermediadores entre você e as floriculturas parceiras. Empenhamo-nos para garantir ' +
        'qualidade e cumprimento dos pedidos, dentro dos limites da legislação aplicável.</p>' +
        '<h3>5. Contato</h3><p>' + EMPRESA.email + ' · WhatsApp ' + EMPRESA.whatsapp + '.</p>'
    },
    'politica-de-privacidade': {
      title: 'Política de Privacidade (LGPD)',
      html:
        '<p>Esta Política descreve como tratamos seus dados pessoais, em conformidade com a <strong>Lei Geral de Proteção de Dados ' +
        '(Lei nº 13.709/2018 - LGPD)</strong>.</p>' +
        '<h3>1. Dados que coletamos</h3><p>Nome, e-mail, telefone, CPF (para emissão de documento fiscal e validação do pagamento) e ' +
        'endereço de entrega — fornecidos por você ao finalizar um pedido.</p>' +
        '<h3>2. Para que usamos</h3><p>Processar e entregar seu pedido, repassá-lo à floricultura parceira responsável, viabilizar o ' +
        'pagamento e manter contato sobre a compra.</p>' +
        '<h3>3. Com quem compartilhamos</h3><p>Apenas com a <strong>floricultura parceira</strong> que realizará a entrega e com o ' +
        '<strong>processador de pagamento</strong>. Não vendemos seus dados.</p>' +
        '<h3>4. Seus direitos</h3><p>Você pode solicitar a qualquer momento o acesso, a correção, a portabilidade ou a exclusão dos seus ' +
        'dados, bem como revogar consentimentos, pelo e-mail ' + EMPRESA.email + '.</p>' +
        '<h3>5. Segurança e retenção</h3><p>Adotamos medidas de segurança para proteger seus dados e os mantemos apenas pelo tempo ' +
        'necessário para as finalidades acima ou por obrigação legal.</p>'
    },
    'trocas-e-devolucoes': {
      title: 'Trocas, Devoluções e Reembolsos',
      html:
        '<h3>Direito de arrependimento</h3><p>Conforme o art. 49 do Código de Defesa do Consumidor, você pode desistir da compra em até ' +
        '<strong>7 dias corridos</strong> a partir do recebimento. Por se tratar de produtos perecíveis (flores), a devolução só é ' +
        'possível enquanto o pedido ainda não foi preparado/enviado pela floricultura parceira.</p>' +
        '<h3>Produto com defeito ou diferente do pedido</h3><p>Se o pedido chegar com problema, entre em contato em até 24h com fotos. ' +
        'Faremos a <strong>troca ou o reembolso</strong> sem custo.</p>' +
        '<h3>Reembolsos</h3><p>Reembolsos via PIX são processados rapidamente após a aprovação. Pagamentos em cartão podem levar até ' +
        'duas faturas para serem creditados, conforme a operadora.</p>' +
        '<h3>Como solicitar</h3><p>Fale com nosso SAC: ' + EMPRESA.email + ' · WhatsApp ' + EMPRESA.whatsapp + '.</p>'
    },
    'politica-de-cookies': {
      title: 'Política de Cookies',
      html:
        '<p>Utilizamos cookies para o funcionamento do site, para lembrar suas preferências e para medir e melhorar a sua experiência, ' +
        'além de personalizar anúncios.</p>' +
        '<h3>Tipos de cookies</h3><p><strong>Essenciais</strong> (necessários ao funcionamento), <strong>de desempenho</strong> ' +
        '(estatísticas de uso) e <strong>de publicidade</strong> (anúncios mais relevantes).</p>' +
        '<h3>Como gerenciar</h3><p>Você pode bloquear ou apagar cookies nas configurações do seu navegador. Alguns recursos do site ' +
        'podem deixar de funcionar corretamente.</p>'
    },
    'sac': {
      title: 'Atendimento (SAC)',
      html:
        '<p>Precisa de ajuda com um pedido, troca, reembolso ou dúvida? Fale com a gente:</p>' +
        '<p><strong>E-mail:</strong> ' + EMPRESA.email + '<br><strong>WhatsApp:</strong> ' + EMPRESA.whatsapp +
        '<br><strong>Sede:</strong> ' + EMPRESA.endereco + '</p>' +
        '<p>Atendimento de segunda a sábado, das 8h às 18h. Responderemos o mais rápido possível.</p>'
    }
  };
  window.POLICIES = POLICIES;

  window.openPolicy = function (slug) {
    var p = POLICIES[slug];
    if (!p) return;
    var t = document.getElementById('policyTitle');
    var c = document.getElementById('policyContent');
    if (t) t.textContent = p.title;
    if (c) c.innerHTML = p.html;
    if (typeof showPage === 'function') showPage('policyPage');
    try { history.replaceState(history.state, '', '/' + slug); } catch (e) {}
  };

  // Roteamento ao carregar: /termos-de-uso, /politica-de-privacidade, etc.
  function routePolicyFromUrl() {
    var slug = (location.pathname || '/').replace(/^\/+|\/+$/g, '').toLowerCase();
    if (slug && POLICIES[slug]) window.openPolicy(slug);
  }

  function init() {
    var back = document.getElementById('policyBackBtn');
    if (back) back.addEventListener('click', function () { if (typeof showPage === 'function') showPage('homePage'); });
    routePolicyFromUrl();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
