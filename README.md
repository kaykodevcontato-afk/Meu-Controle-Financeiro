# Meu Controle Financeiro — site para GitHub Pages

Site pessoal gratuito para controlar entradas, gastos, reservas, orçamento mensal, contas fixas, metas de economia e cofrinhos com Desafio Woodbox. Desenvolvido para publicar sem servidor no **GitHub Pages**.

## O que o site faz

- **Visão geral:** painel de entradas, gastos, dinheiro guardado e saldo livre; gráficos do ano e dos gastos por categoria.
- **Lançamentos:** adicionar, editar, excluir, filtrar por mês e pesquisar entradas, gastos e reservas.
- **Orçamento:** limitar gastos por categoria, em cada mês, e copiar limites do mês anterior.
- **Contas fixas:** cadastrar previsões mensais, com dia de vencimento, valor e situação ativa/pausada. **Não** entram automaticamente nos gastos.
- **Metas:** acompanhar objetivos, saldo inicial e reservas vinculadas a cada objetivo.
- **Cofrinhos:** criar vários cofrinhos livres com meta de economia; depositar e retirar com histórico.
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
