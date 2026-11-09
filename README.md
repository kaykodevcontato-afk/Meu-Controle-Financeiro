# Meu Controle Financeiro — site para GitHub Pages

Site pessoal gratuito para controlar entradas, gastos, reservas, orçamento mensal, contas fixas, metas de economia e cofrinhos com Desafio Woodbox. Desenvolvido para publicar sem servidor no **GitHub Pages**.

## O que o site faz

- **Visão geral:** painel de entradas, gastos, dinheiro guardado e saldo livre; gráficos do ano e dos gastos por categoria.
- **Lançamentos:** adicionar, editar, excluir, filtrar por mês e pesquisar entradas, gastos e reservas.
- **Orçamento:** limitar gastos por categoria, em cada mês, e copiar limites do mês anterior.
- **Contas fixas:** cadastrar previsões mensais, com dia de vencimento, valor e situação ativa/pausada. **Não** entram automaticamente nos gastos.
- **Metas:** acompanhar objetivos, saldo inicial e reservas vinculadas a cada objetivo.
- **Cofrinhos:** criar vários cofrinhos livres com meta de economia; depositar e retirar com histórico.
- **Simulador de rendimentos (NOVO):** na aba Cofrinhos, informe um saldo em reais ou selecione um cofrinho existente; veja estimativas **brutas** por dia útil, por mês e pelo prazo escolhido para um investimento atrelado ao CDI (com % configurável) e para o Tesouro Selic. Configure as taxas manualmente ou use o botão de consulta ao Banco Central (SGS 12 e 11) quando houver internet e a API permitir. Sem transações, depósitos nem integração com corretoras. Os 10% anuais iniciais são **apenas exemplo**. Simulação com 252 dias úteis/ano e 21 por mês; desconsidera IR, IOF, custódia, spread e variação futura das taxas. Essas projeções não são saldos reais.
- **Fontes de câmbio (NOVO):** na aba **Apps, pontos e moedas**, o conversor oferece seleção Automática (CoinGecko → CoinMarketCap → CoinPaprika) ou fonte individual para cripto; moedas tradicionais usam Frankfurter. Links externos para conferir preços no CoinGecko, CoinMarketCap, Investing.com, Frankfurter e CoinPaprika. APIs externas dependem de conexão, CORS e limites do provedor; não se inventa cotação quando falham. A escolha da fonte permanece no backup.
- **Desafio Woodbox:** cartela de depósito com casas que você marca quando guarda o dinheiro. Modelos de R$ 1.000, R$ 3.000, R$ 5.000, R$ 10.000 e R$ 30.000; modalidades crescentes de R$ 1 a R$ 100 ou 200, ou cartela personalizada de 1 a 500 casas e valor por casa.
  - A opção R$ 30.000 usa **300 depósitos de R$ 100**; a opção R$ 3.000 usa **300 depósitos de R$ 10**, para não confundir quantidade de casas com valor depositado.
  - Ao confirmar uma casa, o site cria um lançamento **Reserva** com valor e data. Desfazer a marcação remove o lançamento correspondente.
  - As reservas do cofrinho já entram no dinheiro guardado do painel: **não registre o mesmo depósito duas vezes**.
  - O cofrinho é **somente um controle virtual**; o site não movimenta nem custodia dinheiro.
- **Backup rápido no topo:** botão **Backup do dia** baixa imediatamente um JSON com todos os dados, incluindo Woodbox, metas, contas e histórico. O botão vizinho **Backup e transferência** abre opções para compartilhar o backup (se o navegador permitir), restaurar JSON e exportar CSV para Excel. Em navegadores sem compartilhamento de arquivo, é feito o download para envio manual.
- Layout que funciona em desktop e celular. Não usa backend, banco de dados ou chave de API.

## Como publicar no GitHub (passo a passo)

1. Descompacte `Controle_Financeiro_GitHub.zip`.
2. Entre em https://github.com e clique em **New repository**.
3. Digite um nome, por exemplo `meu-controle-financeiro`, selecione **Public** e crie o repositório.
4. Abra o repositório, clique em **Add file → Upload files** e envie **os arquivos que estão dentro da pasta**, deixando `index.html` na **raiz** do repositório:

   ```text
   meu-controle-financeiro/
   ├── index.html
   ├── style.css
   ├── app.js
   ├── favicon.svg
   ├── assets/
   │   ├── css/
   │   │   ├── contas-prioridades.css
   │   │   ├── rendimentos-simulador.css
   │   │   └── cotacoes-fontes.css
   │   └── js/
   │       ├── contas-prioridades.js
   │       ├── rendimentos-simulador.js
   │       └── cotacoes-fontes.js
   ├── docs/GUIA_DE_EDICAO.md
   ├── tests/
   ├── .nojekyll
   └── README.md
   ```

5. Clique em **Commit changes**.
6. Em **Settings → Pages**, escolha **Deploy from a branch**, selecione `main` e a pasta `/(root)`, e clique **Save**.
7. Depois de a publicação terminar, o endereço costuma ser:

   `https://SEU-USUARIO.github.io/meu-controle-financeiro/`

   Troque `SEU-USUARIO` pelo seu nome de usuário e o nome final da URL pelo nome real do repositório.

> Não envie apenas o arquivo ZIP para o repositório: descompacte e coloque `index.html` no nível principal.

## Como usar

1. Escolha mês e ano no topo.
2. Clique em **Novo lançamento** e registre uma receita (`Entrada`), despesa (`Gasto`) ou transferência para suas economias (`Reserva`). Registre sempre valor **positivo**.
3. Em **Orçamento**, defina limites mensais por categoria.
4. Em **Contas fixas**, anote contas recorrentes. Quando pagar uma conta, lance o pagamento em Lançamentos (tipo `Gasto`).
5. Em **Minhas metas**, crie objetivos; ao cadastrar uma reserva, selecione a meta a que ela pertence.
6. Em **Cofrinhos e Woodbox**, clique em **Criar cofrinho**. Escolha Cofrinho livre ou Desafio Woodbox. Para o Woodbox, selecione um modelo, abra a cartela e marque uma casa somente após separar aquele valor. Clique novamente numa casa marcada para desfazer um registro.
7. Em qualquer tela, toque no botão **Backup do dia** no topo para baixar um arquivo JSON completo. Para transferir para outro aparelho, use **Backup e transferência → Transferir / compartilhar** ou envie o JSON de forma privada e, no aparelho de destino, escolha **Restaurar backup**. O arquivo importa os registros completos e **substitui** os dados do aparelho de destino.

### Exemplo de cálculo

- Entradas do mês: R$ 2.000,00
- Gastos do mês: R$ 1.200,00
- Reservas do mês: R$ 300,00
- **Saldo disponível: R$ 500,00**

O dinheiro reservado sai do saldo livre, mas **não é classificado como despesa**. Um **Resgate** do cofrinho aumenta o saldo disponível e reduz o saldo guardado, sem virar renda nova. Valores de "Já tinha guardado" nas metas não entram como receita no mês.

## Atenção: privacidade e armazenamento

- O site guarda os dados no **localStorage do navegador**, e **não** no repositório GitHub, na nuvem ou em servidor.
- A versão publicada não pede cadastro nem senha. Abrir a URL em outro celular ou outro navegador **não** mostra os registros do primeiro.
- Os dados podem ser perdidos ao limpar os dados do navegador, usar modo anônimo ou desinstalar o navegador. Faça backups JSON periodicamente.
- **Não envie arquivos de backup JSON ou CSV com informações pessoais para um repositório público.**
- O site não acessa contas bancárias, não faz Pix e não sincroniza movimentações automaticamente.
- Como não há autenticação, qualquer pessoa com acesso ao mesmo perfil de navegador no mesmo aparelho pode visualizar as informações locais.

## Estrutura do código

- `index.html`: estrutura das sete telas, formulários e interface.
- `style.css`: cores, layout responsivo e componentes visuais.
- `app.js`: regras de cálculo, cadastros, cartelas Woodbox, depósitos, navegação, armazenamento e backup.
- `favicon.svg`: ícone do site.

Para trocar o nome da marca, edite o texto `Meu Controle` no `index.html`. Para mudar cores, edite as variáveis no início de `style.css`. Categorias e meses estão declarados no início de `app.js`.

**Créditos:** Dev Kayko.

## Atualizando a versão antiga sem apagar seus dados

1. Abra a versão publicada do site e exporte um **backup JSON** antes de atualizar os arquivos (na versão nova, há também o botão **Backup do dia** no topo).
2. Substitua `index.html`, `style.css` e `app.js` no mesmo repositório, fazendo o commit.
3. Abra a mesma URL do GitHub Pages no mesmo navegador. O site utiliza a **mesma chave de armazenamento local** da primeira versão; os lançamentos e metas continuam disponíveis.
4. Se mudou de navegador/dispositivo, importe o backup JSON no novo dispositivo. Backups da versão anterior também são aceitos.
5. Faça backups periódicos também após criar cofrinhos; as cartelas concluídas fazem parte desse arquivo.

## Salvamento rápido no topo — novidade

- **Backup do dia:** um toque baixa `controle-financeiro-backup-AAAAMMDD.json`. O nome traz a **data local atual**, independentemente do mês selecionado no painel. O arquivo contém **todos os meses**, cofrinhos, cartelas Woodbox e demais dados, não apenas os lançamentos de hoje.
- **Backup e transferência:** abre opções de download, compartilhamento, restauração e CSV. A transferência usa o compartilhamento do dispositivo **se houver suporte**; caso contrário, o download do JSON permite enviá-lo manualmente (por e-mail privado, transferência local, etc.).
- **Restaurar backup:** substitui os dados locais após confirmação explícita. Sempre exporte o estado atual do destino antes de importar.
- O site continua salvando alterações automaticamente no próprio navegador. O botão de backup **não** cria uma cópia em nuvem ou no GitHub.

### Crédito no rodapé

O crédito **© 2026 Meu Controle Financeiro | Desenvolvido por Dev Kayko** aparece em todas as abas do site. O nome é um link para o Instagram: https://www.instagram.com/alien_okyak/

---

## Atualização — apps, pontos, moedas, orçamento e aparência

Nesta versão, **todos os recursos antigos continuam** e foram acrescentadas as opções abaixo.

### Apps, pontos e moedas

Abra **Apps, pontos e moedas** no menu lateral e selecione **Adicionar app / saldo**.

- **Saldo em moeda:** escreva o nome do aplicativo, o saldo e escolha a moeda (BRL, USD, EUR, GBP, JPY, CAD, CHF, ARS, MXN ou AUD).
- **Pontos:** registre a quantidade acumulada e, se souber, o valor de resgate no formato **quantos pontos são necessários para 1 dólar**. Por exemplo, 2.500 pontos com taxa de 1.000 pontos/US$ 1 equivalem a **US$ 2,50**, antes do câmbio para reais.
- **Criptomoedas:** digite a quantidade que já tem e escolha entre BTC, ETH, SOL, USDT, USDC, BNB, DOGE, ADA, XRP e LTC. Você pode cadastrar o preço unitário **manual em dólares** ou deixar esse campo vazio para tentar usar a cotação externa.
- É possível **editar e excluir** cada app/saldo. O botão **Atualizar cotações** descarta cotações em memória e consulta os serviços novamente.

**Atenção:** estes são registros *manuais*; o site não acessa a conta dos outros aplicativos, não consulta automaticamente seu saldo verdadeiro, não faz resgate, não guarda criptomoedas e **não soma saldos externos no saldo disponível das entradas e gastos**. Só inclua valores que você realmente possui. Se a cotação falhar, o valor estimado será apresentado como indisponível, não como uma taxa inventada. Algumas plataformas impõem mínimos de saque ou taxas, que não entram nos cálculos.

### Conversor integrado

Na mesma tela, informe um valor, escolha a moeda de origem e a de destino e clique em **Converter**. O conversor permite trocas de referência entre moedas tradicionais e criptomoedas, inclusive cripto → cripto, conforme a disponibilidade dos serviços.

- Câmbio de moedas tradicionais: [Frankfurter](https://frankfurter.dev/), sem chave de API, dados de referência atualizados periodicamente.
- Criptomoedas: [CoinPaprika](https://coinpaprika.com/developers), no acesso público, sujeita a limites de uso e indisponibilidade. **Powered by CoinPaprika**.
- O conversor **precisa de internet**. As estimativas não incluem tarifas, spreads, impostos ou preços específicos do aplicativo onde você possui o saldo. Consultas podem ficar temporariamente indisponíveis.
- A opção de preço manual da cripto é usada **apenas para o app/saldo cadastrado**, não substitui as cotações do conversor geral.

### Mais categorias no orçamento

Entre em **Orçamento → Adicionar categoria**, informe um nome e salve. As categorias extras ficam disponíveis nos **Gastos**, nas **Contas fixas** e nos limites mensais de orçamento. Você pode renomeá-las; lançamentos, contas e limites antigos associados acompanham a mudança. A exclusão é impedida enquanto houver lançamentos ou contas com essa categoria, para proteger o histórico; caso contrário, os limites relacionados serão excluídos após confirmação.

### Quatro cores, dois modos

No cabeçalho do site, selecione **Padrão**, **Azul**, **Rosa** ou **Roxo**, nesta ordem. O botão ao lado permite alternar entre **Claro** e **Escuro**. São oito combinações. **Padrão** e **Rosa** são apenas renomeações das opções anteriores **Atual** e **Rosa clarinho**, sem alteração da escolha salva. As opções são salvas neste navegador, juntamente com os outros dados, e entram no backup JSON.

### Manter os dados ao atualizar no GitHub Pages

1. **Antes de substituir os arquivos**, abra a versão atual no mesmo navegador e use **Backup do dia**.
2. Faça o upload de `index.html`, `style.css`, `app.js`, `favicon.svg`, `README.md` e `.nojekyll` na raiz do mesmo repositório (sobrescrevendo os arquivos existentes).
3. Continue acessando a **mesma URL** no mesmo navegador; a chave de armazenamento continua `kayko-controle-financeiro-v1` e os dados antigos permanecem.
4. Seus backups JSON anteriores também podem ser importados. Os novos backups incluirão apps/saldos, categorias criadas e aparência escolhida.
5. Não publique backups financeiros no GitHub público. A versão continua sem login/sincronização automática entre aparelhos; use as opções de backup e transferência.

**Observação:** ao mudar de endereço do GitHub Pages ou de navegador, os dados armazenados no dispositivo não migram automaticamente. Restaure seu backup privado.


---

## Atualização — prioridade de pagamento das contas fixas

Na aba **Contas fixas**, as contas ativas agora aparecem em ordem do próximo vencimento (mais urgente primeiro). O painel inicial **Próximas contas** usa a mesma ordem e mostra as mesmas cores:

| Cor | Quando aparece | Exemplo |
| --- | --- | --- |
| 🟢 Verde | Faltam **7 dias ou mais** | Vence em 8 dias |
| 🟡 Amarelo | Faltam **2 a 6 dias** | Vence em 3 dias |
| 🔴 Vermelho | Vence **amanhã ou hoje** | Faltam 1 dia / hoje |
| ⚪ Cinza | Conta pausada | Sem aviso ativo |

- O cálculo usa a **data atual do aparelho**, independentemente do mês e ano selecionados para filtrar o painel.
- Contas com vencimento no dia 29, 30 ou 31 em meses menores são consideradas com vencimento no **último dia disponível** desse mês.
- Como as contas são **previsões recorrentes** e não possuem registro de quitação na própria seção, o aviso exibe a **próxima data**. Não afirma que a parcela anterior foi paga ou está atrasada.
- Não houve mudança no modelo de armazenamento: os registros antigos e os backups JSON continuam compatíveis.

### Organização do código no GitHub

Leia **[docs/GUIA_DE_EDICAO.md](docs/GUIA_DE_EDICAO.md)** para localizar o que editar. Os avisos de prioridade estão isolados em dois novos arquivos:

- `assets/js/contas-prioridades.js`: dia de vencimento, regras de cor e ordem das contas.
- `assets/css/contas-prioridades.css`: aparência dos avisos, inclusive em modo escuro.

**Envie também a pasta `assets` e a pasta `docs` quando atualizar o GitHub Pages.**


## Simulador de rendimentos (CDI e Tesouro Selic)

1. Abra **Cofrinhos e Woodbox → Quanto seu dinheiro poderia render?**.
2. Em **Usar saldo de**, escolha **Valor informado por mim** (ex.: R$ 1.000,00) ou algum dos cofrinhos já cadastrados. Usar um cofrinho não altera o valor guardado.
3. Escolha **dias úteis** ou **meses** e quantos períodos deseja projetar. Um mês é aproximado como **21 dias úteis**.
4. Defina o percentual remunerado do CDI (ex.: 100%, 110%) e as taxas **anuais**. Começam em **10% de exemplo** (não são taxas atuais). Para dados oficiais atualizados, clique em **Consultar Banco Central**. Se a API bloquear a consulta ou estiver sem conexão, pode preencher manualmente.
5. Confira os **rendimentos brutos projetados** para o prazo escolhido, além das estimativas separadas por **1 dia útil** e por **1 mês**.

### Como a conta é feita

- CDI e Selic: a taxa diária equivalente é `(1 + taxa_anual/100)^(1/252) - 1`.
- Para uma aplicação que paga parte do CDI: `taxa_dia_investimento = taxa_dia_CDI × (% do CDI / 100)`.
- Total projetado: `principal × (1 + taxa_dia)^(dias_úteis)`. Rendimento bruto é `total - principal`.
- Banco Central: série **12** informa CDI diário; série **11** Selic efetiva diária. Ambas são anualizadas considerando 252 dias úteis.
- **Atenção:** o Tesouro Selic é apenas aproximado pela Selic efetiva; preço do título, spread, custódia e impostos podem alterar o resultado. CDI é índice de referência, não um investimento disponível diretamente. O simulador **não considera** IR, IOF, custódia B3 e outras taxas; são valores brutos, não promessa de rentabilidade.

**Editar:** cálculo e consulta BCB em `assets/js/rendimentos-simulador.js`, aparência em `assets/css/rendimentos-simulador.css`, formulário em `index.html`, persistência e integração em `app.js`. Mais detalhes em `docs/GUIA_DE_EDICAO.md`.

Fontes: [Banco Central, taxa CDI série 12](https://www3.bcb.gov.br/sgspub/consultarvalores/consultarValoresSeries.do?method=consultarSeries&series=12), [Selic série 11](https://dadosabertos.bcb.gov.br/dataset/11-taxa-de-juros---selic), [Tesouro Direto — regras e impostos](https://www.tesourodireto.com.br/sobre-o-tesouro/regras-e-regulamento).

## Cotações e referências – edição rápida

- `assets/js/cotacoes-fontes.js`: CoinGecko, CoinMarketCap (API pública keyless), CoinPaprika, lista de ativos e links para Investing.com.
- `assets/css/cotacoes-fontes.css`: seleção e atalhos no visual claro/escuro.
- `app.js`: uso das fontes no conversor e no cálculo de saldos cadastrados.
- **Atenção:** não há API pública oficial do Investing.com para leitura direta. Abrimos o site para conferência. No CoinMarketCap, a API pública keyless é documentada, mas requisições de navegador podem ser bloqueadas por políticas de CORS; nesse caso a opção Automática tenta outras fontes.
- Cotações são referências, podem ser diferentes dos valores praticados no resgate e não movimentam dinheiro.

## Novidade — Investimentos e Trade (2026-11-09)

Acesse **Investimentos e Trade** pelo menu lateral. Esta área é **educacional e de acompanhamento manual**, sem abrir conta, sem conexão com corretora e sem negociar ativos.

- **Catálogo:** Petrobras (PETR4), Vale (VALE3), Itaú (ITUB4), Magazine Luiza (MGLU3), BOVA11, IVVB11, Apple (AAPL), Microsoft (MSFT), USO (fundo de futuros de petróleo), Bitcoin (BTC) e Ethereum (ETH).
- **Preços:** por solicitação, o sistema tenta consultar PETR4, VALE3, ITUB4, MGLU3 pela API pública de testes brapi.dev e BTC/ETH pelas fontes de cripto do conversor. As outras ações/ETFs exigem preço manual ou consulta em links externos. As cotações podem falhar ou estar atrasadas. As referências do catálogo (incluindo PETR4 R$ 45,36 e AAPL US$ 342,37) são **fechamentos de 06/11/2026**, nunca cotação atual, e não são utilizadas como cotação atual da carteira.
- **Valor para começar:** ações e ETFs brasileiros permitem 1 unidade no mercado fracionário; criptomoedas admitem frações; ações nos EUA podem admitir frações dependendo da corretora. Valor mínimo e custos variam por instituição.
- **Simulador de trade:** informe capital, preço por unidade e uma variação hipotética, positiva ou negativa; o site calcula quantidade, saldo restante, valor final e ganho/prejuízo **não garantidos**. Sem dividendos, tributos, spread, taxas e câmbio automático garantido.
- **Carteira manual:** cadastre ativo, quantidade, preço médio pago, data, observações e opcionalmente um preço atual manual. O site calcula valorização somente se houver cotação consultada ou informada. Não altera o saldo disponível e salva os registros no backup JSON.
- **Conversão:** botão consulta USD/BRL no Frankfurter, com possibilidade de digitar cotação. Se faltar câmbio ou cotação, os resumos exibem **parcial**, em vez de inventar valores.

### Arquivos da área

| Arquivo | O que editar |
|---|---|
| `index.html` | Tela, textos, links para corretoras e campos |
| `assets/js/investimentos-trade.js` | Lista `ATIVOS`, regras, fontes, simulações, posições |
| `assets/css/investimentos-trade.css` | Visual e responsividade, inclusive modo escuro |
| `app.js` | Integração com o armazenamento, backup e menu |
| `tests/investimentos-trade.test.js` | Testes das regras e validação dos backups |

A chave do armazenamento local continua **`kayko-controle-financeiro-v1`**, e o formato geral de backup permanece **`version:1`**, aceitando backups das versões anteriores. Os registros de investimento são opcionais (`investments: []`). Atualize todos os arquivos do ZIP no mesmo repositório GitHub Pages, preservando a pasta `assets`.

**Segurança:** nunca coloque em arquivos públicos tokens de corretoras, credenciais bancárias ou chaves privadas. APIs públicas podem estar indisponíveis por CORS ou rate limiting. Lucros não são garantidos, e o day trade pode causar perdas rápidas.

Fontes para referência: https://brapi.dev/faq/api-e-gratis-mesmo • https://investor.apple.com/stock-price/default.aspx • https://www.tesourodireto.com.br/sobre-o-tesouro/regras-e-regulamento • https://www.uscfinvestments.com/uso

**Fontes das referências datadas do catálogo:** Petrobras, Vale, Itaú, Magazine Luiza, BOVA11 e IVVB11: https://www.cotab3.com.br/ ; Apple: https://investor.apple.com/stock-price/default.aspx ; Microsoft: https://stockanalysis.com/stocks/msft/history/ ; USO: https://br.investing.com/etfs/united-states-oil-fund-historical-data .

## Novidade — valor por ponto em reais ou dólares

Ao selecionar **Apps, pontos e moedas → Adicionar app / saldo → Pontos / recompensas**, escolha a forma de cotação manual: quantos pontos equivalem a US$ 1 (modo anterior), quanto vale 1 ponto em reais (BRL) ou quanto vale 1 ponto em dólares (USD). A prévia calcula o total no próprio formulário. A cotação em dólares é convertida para reais usando a fonte de câmbio do site quando disponível. Valores estimados não entram nas receitas nem no saldo disponível. Os dados e a forma de cálculo são incluídos nos backups JSON.
