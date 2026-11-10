# Guia de edição — Meu Controle Financeiro | Dev Kayko

Este guia foi feito para você localizar rapidamente a funcionalidade que deseja alterar no editor do GitHub, sem procurar no site inteiro.

## 1. Qual arquivo editar?

| O que deseja mudar? | Arquivo | O que procurar (Ctrl+F) |
|---|---|---|
| **Cores verde/amarelo/vermelho das contas** | [`assets/css/contas-prioridades.css`](../assets/css/contas-prioridades.css) | `--bill-green-bg`, `--bill-yellow-bg`, `--bill-red-bg` |
| **Prazos dos alertas** | [`assets/js/contas-prioridades.js`](../assets/js/contas-prioridades.js) | `PRIORITY_DAYS` |
| **Data do próximo vencimento** | [`assets/js/contas-prioridades.js`](../assets/js/contas-prioridades.js) | `nextDueDate` |
| **Ordem das contas** | [`assets/js/contas-prioridades.js`](../assets/js/contas-prioridades.js) | `sortBills` |
| **Colunas/legenda das contas** | [`index.html`](../index.html) | `CONTAS FIXAS` |
| **Tabela das contas** | [`app.js`](../app.js) | `function renderBills` |
| **Próximas contas no início** | [`app.js`](../app.js) | `function renderUpcomingBills` |
| **Cadastro e edição de contas** | [`app.js`](../app.js) | `kind==='bill'` |
| **Menu, telas e textos fixos** | [`index.html`](../index.html) | `view-contas`, `view-orcamento`, `view-carteiras` |
| **Categorias iniciais** | [`app.js`](../app.js) | `EXPENSE_CATS` |
| **Limites do orçamento** | [`app.js`](../app.js) | `function renderBudgets` |
| **Apps, pontos e criptomoedas** | [`app.js`](../app.js) | `function renderWallets` |
| **APIs CoinGecko/CoinMarketCap/CoinPaprika e links Investing** | [`assets/js/cotacoes-fontes.js`](../assets/js/cotacoes-fontes.js) | `priceUSD`, `referenceLinks`, `ASSETS` |
| **Opções/visual das fontes de cotação** | [`index.html`](../index.html), [`assets/css/cotacoes-fontes.css`](../assets/css/cotacoes-fontes.css) | `cryptoQuoteSource`, `.quote-source-bar` |
| **Cálculos do conversor e preferências** | [`app.js`](../app.js) | `function convertCurrencies`, `cryptoPrice` |
| **Paletas e modo escuro** | [`style.css`](../style.css) | `data-theme="blue"`, `data-theme="pink"`, `data-theme="purple"`, `data-mode="dark"` |
| **Cofrinhos e Woodbox** | [`app.js`](../app.js) | `function renderCoffers` |
| **Fórmula e taxas CDI/Tesouro Selic** | [`assets/js/rendimentos-simulador.js`](../assets/js/rendimentos-simulador.js) | `DEFAULTS`, `compare`, `fetchRates` |
| **Cores e layout do simulador** | [`assets/css/rendimentos-simulador.css`](../assets/css/rendimentos-simulador.css) | `.yield-panel`, `.yield-result-card` |
| **Campos do simulador** | [`index.html`](../index.html) | `SIMULADOR DE RENDA FIXA` |
| **Ligação com cofrinhos e backup** | [`app.js`](../app.js) | `function renderYieldSimulator`, `handleYieldInput` |
| **Backup e restauração** | [`app.js`](../app.js) | `function backupExport`, `function backupImport` |
| **Créditos e redes sociais** | [`index.html`](../index.html) | `footer-credits` |

## 2. Como mudar os dias das prioridades

Abra `assets/js/contas-prioridades.js`. No início do código existe:

```js
const PRIORITY_DAYS = Object.freeze({ redThrough: 1, yellowThrough: 6 });
```

- `redThrough: 1`: vermelho para hoje e amanhã (0–1 dia).
- `yellowThrough: 6`: amarelo de 2 a 6 dias.
- Acima de 6 dias, verde.

Exemplo: para que vermelho vá até 2 dias e amarelo até 5, use `redThrough: 2, yellowThrough: 5`. Lembre-se de atualizar também a legenda no `index.html` e este guia.

## 3. Como mudar as cores

Abra `assets/css/contas-prioridades.css`. Modifique as variáveis `--bill-green-*`, `--bill-yellow-*` e `--bill-red-*`. No final do arquivo, as configurações `html[data-mode="dark"]` controlam as cores do modo escuro. Use letras legíveis sobre o fundo: fundo escuro precisa de texto claro, e vice-versa.

## 4. Onde fica cada parte do projeto?

```text
meu-controle-financeiro/
├── index.html                   # Estrutura de todas as seções
├── app.js                       # Lógica geral: cadastros, gráficos, backup
├── style.css                    # Layout geral e temas Padrão/Azul/Rosa/Roxo
├── favicon.svg                  # Ícone
├── assets/
│   ├── js/
│   │   ├── contas-prioridades.js   # Cálculo de prazos
│   │   ├── rendimentos-simulador.js # CDI, Selic e juros compostos
│   │   └── cotacoes-fontes.js    # APIs e links para câmbio
│   └── css/
│       ├── contas-prioridades.css # Cores dos avisos
│       ├── rendimentos-simulador.css # Visual do simulador
│       └── cotacoes-fontes.css # Seletor e links
├── docs/
│   └── GUIA_DE_EDICAO.md        # Este guia
├── README.md                    # Instruções de publicação
└── .nojekyll                    # Configuração GitHub Pages
```

No `app.js`, as funções estão marcadas com seções `01`, `02`, etc. Use **Ctrl+F** e busque `===== 03` ou o nome de uma função.

## 5. Atualizar sem perder dados

1. Antes de editar, abra o site publicado e clique em **Backup do dia**. Guarde o JSON em local privado.
2. No repositório do GitHub, faça upload dos arquivos mantendo a mesma estrutura de pastas (inclusive `assets`). Substitua os arquivos anteriores e confirme o commit.
3. Acesse a URL de sempre no mesmo navegador. A chave de armazenamento local continua `kayko-controle-financeiro-v1`.
4. Se mudou de aparelho/navegador, importe o backup JSON pela área **Backup e transferência**.

**Atenção:** cores indicam proximidade do próximo vencimento da conta recorrente. O aplicativo ainda não registra quitação/atraso de cada parcela mensal dentro da seção Contas fixas; pagar uma conta deve ser registrado em **Lançamentos** quando ocorrer. Não publique os backups no GitHub público.


## 6. Como personalizar o simulador CDI / Tesouro Selic

Abra `assets/js/rendimentos-simulador.js`:
- `EXAMPLE_RATE = 10`: taxa **meramente ilustrativa** usada antes de consultar o Banco Central.
- `WORK_DAYS_YEAR = 252`: dias úteis convencionais do ano financeiro.
- `WORK_DAYS_MONTH = 21`: média mensal aproximada usada no site.
- `compare()`: cálculo por juros compostos, bruto, do CDI e Tesouro Selic aproximado.
- `fetchRates()`: consulta as taxas diárias das séries SGS **12 (CDI)** e **11 (Selic efetiva)** no Banco Central, convertendo para anual.

Abra `assets/css/rendimentos-simulador.css` para editar espaçamentos, cores, cartões e campos, sem misturar com o CSS da prioridade das contas.

Abra `index.html` e procure `SIMULADOR DE RENDA FIXA` para mudar títulos, textos, campos e explicações.

Abra `app.js` e procure `03-B. SIMULADOR` para entender as opções de saldo, atualização dos resultados e como os parâmetros são incluídos em `settings.investmentSimulator` nos backups JSON.

**As previsões não criam lançamentos, não alteram o saldo de cofrinhos e não constituem um rendimento real.**

## 7. Fontes de câmbio e criptomoedas

- Abra `assets/js/cotacoes-fontes.js` para mudar as APIs usadas ou os links para sites. `ASSETS` contém os identificadores das criptomoedas cadastradas.
- A seleção **Automática** tenta CoinGecko, CoinMarketCap e CoinPaprika, nessa ordem. Se selecionar uma fonte específica, o site mostra erro quando essa fonte falhar (não inventa preços).
- **Investing.com** oferece links de consulta externa, não API pública: não tente buscar seus preços por raspagem de HTML.
- `app.js` usa `cryptoPrice` para ler as cotações e `convertCurrencies` para calcular. As cotações cripto podem ficar em cache por até 5 minutos; fiat por até 12 horas.
- `index.html` controla os rótulos e `assets/css/cotacoes-fontes.css` controla a aparência.
- A fonte selecionada é salva no backup em `settings.cryptoQuoteSource`. Backups antigos continuam aceitos, com seleção inicial Automática.
- Não coloque tokens, chaves de API privadas ou dados financeiros em scripts públicos do GitHub Pages.
- As referências são informativas: nunca misturar saldo estimado com receitas ou saldos bancários.

## 4. Como editar os quatro temas de cor

- **Padrão:** variáveis `:root` em `style.css`. O valor salvo permanece `current` por compatibilidade com backups antigos.
- **Azul:** seletores `html[data-theme="blue"]` e `html[data-theme="blue"][data-mode="dark"]`.
- **Rosa:** seletores `html[data-theme="pink"]` e `html[data-theme="pink"][data-mode="dark"]`. O valor salvo continua `pink`.
- **Roxo:** seletores `html[data-theme="purple"]` e `html[data-theme="purple"][data-mode="dark"]`.

O texto e a ordem das opções estão em `index.html` no seletor `id="themePalette"`. A lista de valores permitidos e o salvamento ficam em `app.js` (busque por `themePalette`); o botão claro/escuro usa `themeMode`.

Para modificar uma paleta, priorize as variáveis `--ui-bg` (fundo), `--ui-surface` (cartões), `--ui-ink` (títulos), `--ui-body` (textos), `--ui-muted` (textos auxiliares), `--ui-accent` (destaques), `--ui-button` (botões) e `--ui-border` (bordas). Preserve contraste de texto em claro e escuro.

## Investimentos e Trade — como alterar sem mexer no resto

**Menu:** em `index.html`, encontre `data-view="investimentos"`. O conteúdo da nova tela começa em `id="view-investimentos"`.

**Ações, Apple, petróleo, ETFs e criptomoedas:** abra `assets/js/investimentos-trade.js` e edite o array `ATIVOS` no começo do arquivo. Cada item tem: `symbol` (ticker), `name`, `group`, `currency` (BRL/USD), `kind`, `whole` (se só aceita unidade inteira), `url` (cotação), `about` (descrição). `reference`/`referenceDate` são somente exemplos históricos datados, **não preços em tempo real**. Não use referências desatualizadas como preço de execução.

**Cotação automática:** no mesmo JavaScript, procure a função `refreshQuotes()`. Somente os quatro tickers de teste gratuitos da brapi (`PETR4`, `VALE3`, `ITUB4`, `MGLU3`) e as criptomoedas BTC/ETH recebem consultas automáticas. Para outros ativos, mantenha a cotação manual e os links, salvo quando tiver uma API autorizada apropriada. Nunca exponha um token no GitHub Pages.

**Simulador:** em `assets/js/investimentos-trade.js`, edite `simular()` e `renderScenario()`. O percentual informado é **hipotético**, não um rendimento anual/mensal prometido. Se alterar a matemática, atualize os avisos e testes.

**Carteira manual e salvamento:** `normalizeRecords()`, `savePosition()`, `renderPortfolio()`. Integração com `app.js`: `defaultDB()` cria `investments: []`, `normalize()` lê ou restaura a lista (mesmo de backups antigos), `init()` configura o salvamento local. A carteira não movimenta lançamentos nem cofrinhos.

**Cor e contraste dos quatro temas:** altere `assets/css/investimentos-trade.css`, que usa as variáveis `--ui-surface`, `--ui-ink`, `--ui-border`, `--ui-muted`, `--ui-accent` e `--ui-accent-soft`. Evite fixar cores de fundo e texto incompatíveis com modo escuro.

**Referências de sites e corretoras:** a seção `invest-external-list` de `index.html`. Compare sempre custos, elegibilidade e regras diretamente com as instituições.

## Valor manual dos pontos (R$ ou US$)

No arquivo `app.js`, localize `openForm` no bloco `kind==='wallet'` para editar os campos `pointValueMode` e `pointUnitValue`. O cálculo aparece em `valueWalletInBRL`, e a prévia no formulário em `refreshWalletPointPreview`. O modo `legacy` mantém compatibilidade com os registros antigos de pontos por US$ 1. Não inclua essas estimativas como dinheiro recebido.


### Confirmar pagamento de contas fixas
- `app.js`: procure `CONTAS PAGAS: histórico por competência mensal`, `toggleBillPaid` e `renderBills`.
- `assets/css/contas-prioridades.css`: procure `CONTAS PAGAS` para trocar as cores.
- Os registros salvos usam `paidMonths` (ex.: `2026-11`) em cada conta. A importação de backups antigos continua válida. A marcação não cria gastos automaticamente.


### Imprimir relatório completo
- Botão no topo: `index.html` (`printReportButton`).
- Campos e tabelas do relatório e regras de impressão: `assets/js/relatorio-impressao.js`.
- Estilo do botão: `assets/css/relatorio-impressao.css`.
- Evento e acesso aos dados atuais: `app.js` (procure `printReportButton`).

## Pontos de aplicativos — equivalência em reais

Em **Apps, pontos e moedas → Adicionar app ou saldo → Pontos / recompensas**, no campo **Como definir o valor dos pontos?** escolha **Equivalência personalizada em R$**.

- Exemplo A: 1 ponto = R$ 1 → coloque **Pontos de referência = 1**, **Valor equivalente em reais = 1**.
- Exemplo B: 3.615 pontos = R$ 15 → coloque **Pontos de referência = 3615**, **Valor equivalente em reais = 15**.
- A quantidade de pontos possuída é preenchida em **Quantidade de pontos**. O total estimado é calculado automaticamente sem arredondar o valor unitário antes da multiplicação.

**Onde editar:** `app.js`, procure por `pointReferencePoints`, `pointReferenceBRL`, `refreshWalletPointPreview` e `valueWalletInBRL`. A impressão deste dado fica em `assets/js/relatorio-impressao.js`.

Os cadastros antigos de pontos continuam com seu modo de cálculo anterior. O backup JSON inclui as novas informações.

### Impressão: valor total dos pontos

Em `assets/js/relatorio-impressao.js`, edite a função `pointTotal(w)` para modificar as regras de cálculo do total de pontos, ou a seção `Apps, pontos e criptomoedas` para alterar as colunas impressas. A regra é individual de cada aplicativo e utiliza os campos salvos pelo cadastro.

## Equivalência personalizada em dólar e criptomoeda (nova)

Na tela **Apps e moedas → Adicionar app ou saldo → Pontos / recompensas**, escolha o modo:
- **Equivalência personalizada em R$**: exemplo 3.615 pontos = R$ 15.
- **Equivalência personalizada em US$**: exemplo 3.615 pontos = US$ 15.
- **Equivalência personalizada em criptomoeda**: escolha BTC, ETH, SOL, USDT, USDC, BNB, DOGE, ADA, XRP ou LTC e informe a quantidade equivalente.

Para editar: procure `ratioBRL`, `ratioUSD`, `ratioCrypto` no `app.js`. O campo `pointReferenceBRL` mantém o nome histórico para preservar backups antigos, mas agora guarda o **valor equivalente na moeda escolhida**. `pointReferenceCrypto` armazena o símbolo, quando aplicável. Para modificar a impressão, edite `assets/js/relatorio-impressao.js` (`pointTotal` e seção `Apps, pontos e criptomoedas`).

A equivalência é cadastrada manualmente; o valor estimado em reais das regras em dólar ou cripto exige cotação externa disponível. O relatório impresso mostra o valor na moeda da regra sem depender de conexão. Esses valores não representam dinheiro resgatado.
