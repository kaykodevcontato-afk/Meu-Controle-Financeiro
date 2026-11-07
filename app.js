/* Meu Controle Financeiro | Dev Kayko
   Site estático para GitHub Pages. Dados armazenados localmente no navegador.
   Não envia dados para servidores, nem sincroniza entre dispositivos. */
(() => {
  'use strict';
  const STORAGE_KEY = 'kayko-controle-financeiro-v1';
  const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const SHORT_MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const EXPENSE_CATS = ['Moradia','Alimentação','Transporte','Contas','Saúde','Educação','Lazer','Compras','Dívidas','Outros'];
  const INCOME_CATS = ['Salário','Freelance','Vendas','Renda extra','Reembolso','Outros'];
  const PAYMENTS = ['Pix','Dinheiro','Débito','Crédito','Boleto','Transferência','Outro'];
  // Woodbox: os valores exibidos em cada casa são valores REAIS de depósito.
  // Modelos distintos do mercado não seguem uma única tabela: não confunda
  // número da casa (etapa) com o dinheiro a depositar.
  const WOODBOX_PLANS = {
    'mil': {name:'R$ 1.000 · 100 depósitos de R$ 10', count:100, unit:10},
    'tresmil': {name:'R$ 3.000 · 300 depósitos de R$ 10', count:300, unit:10},
    'cincomil': {name:'R$ 5.000 · 100 depósitos de R$ 50', count:100, unit:50},
    'dezmil': {name:'R$ 10.000 · 100 depósitos de R$ 100', count:100, unit:100},
    'trintamil': {name:'R$ 30.000 · 300 depósitos de R$ 100', count:300, unit:100},
    'crescente100': {name:'R$ 5.050 · de R$ 1 até R$ 100', count:100, ascending:true},
    'crescente200': {name:'R$ 20.100 · de R$ 1 até R$ 200', count:200, ascending:true},
    'custom': {name:'Personalizado · parcelas iguais'}
  };
  const CAT_COLORS = ['#38bd9b','#6f9de8','#f0ac80','#9d8bd7','#e47791','#44b6c7','#edc06e','#87b99d','#8592b0','#b3a08b'];
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = (n) => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n)||0);
  const dec = (n) => (Math.round((Number(n) || 0) * 100) / 100);
  const clamp = (n,min,max) => Math.min(max,Math.max(min,n));
  const uid = () => (window.crypto && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const today = () => {const d = new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  const fmtDate = (d) => /^\d{4}-\d{2}-\d{2}$/.test(String(d)) ? `${d.slice(8,10)}/${d.slice(5,7)}/${d.slice(0,4)}` : '—';
  const defaultDB = () => ({version:1, transactions:[], bills:[], goals:[], coffers:[], budgets:{}, settings:{month:11,year:2026,monthlySavingsTarget:0}});
  let db = defaultDB();
  let view = 'painel';
  let editing = null;
  let selectedCofferId = null;
  let toastTimeout;
  let previousFocus = null;
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) db = normalize(JSON.parse(raw));
    } catch (err) { console.warn('Não foi possível ler dados locais:', err); notify('Não foi possível abrir os dados deste navegador.',true); }
  }
  function normalize(candidate) {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate) || candidate.version !== 1 || !Array.isArray(candidate.transactions) || !Array.isArray(candidate.bills) || !Array.isArray(candidate.goals) || !candidate.budgets || typeof candidate.budgets !== 'object' || Array.isArray(candidate.budgets)) throw new Error('Backup inválido ou incompatível.');
    const amount = n => (typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1e12) ? dec(n) : 0;
    const clean = s => String(s??'').slice(0,500);
    const types = ['Entrada','Gasto','Reserva','Resgate'];
    const transactions = candidate.transactions.slice(0,30000).map(t => ({id:clean(t.id||uid()),date:/^\d{4}-\d{2}-\d{2}$/.test(t.date)?t.date:today(),type:types.includes(t.type)?t.type:'Gasto',category:clean(t.category),description:clean(t.description),payment:clean(t.payment),amount:amount(t.amount),goalId:clean(t.goalId),cofferId:clean(t.cofferId),boxSlot:Number.isInteger(t.boxSlot)&&t.boxSlot>=0&&t.boxSlot<500?t.boxSlot:null,notes:clean(t.notes)}));
    const bills = candidate.bills.slice(0,1000).map(b => ({id:clean(b.id||uid()),name:clean(b.name),category:EXPENSE_CATS.includes(b.category)?b.category:'Outros',day:clamp(Math.floor(Number(b.day)||1),1,31),amount:amount(b.amount),active:b.active!==false}));
    const goals = candidate.goals.slice(0,1000).map(g => ({id:clean(g.id||uid()),name:clean(g.name),target:amount(g.target),initial:amount(g.initial)}));
    const coffers = (Array.isArray(candidate.coffers)?candidate.coffers:[]).slice(0,200).map(c => ({
      id:clean(c.id||uid()), name:clean(c.name), mode:c.mode==='woodbox'?'woodbox':'free',
      target:amount(c.target), initial:amount(c.initial),
      plan:WOODBOX_PLANS[c.plan]?c.plan:'mil',
      count:clamp(Math.floor(Number(c.count)||100),1,500),unit:amount(c.unit)
    }));
    const budgets = {};
    for (const key of Object.keys(candidate.budgets).slice(0,1000)) {
      if (/^\d{4}-\d{2}$/.test(key) && candidate.budgets[key] && typeof candidate.budgets[key]==='object') {
        budgets[key] = {};
        for (const cat of EXPENSE_CATS) if (Object.hasOwn(candidate.budgets[key],cat)) budgets[key][cat] = amount(candidate.budgets[key][cat]);
      }
    }
    const settings=candidate.settings||{};
    return {version:1,transactions,bills,goals,coffers,budgets,settings:{month:clamp(Math.floor(Number(settings.month)||11),1,12),year:clamp(Math.floor(Number(settings.year)||2026),2000,2100),monthlySavingsTarget:amount(settings.monthlySavingsTarget)}};
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY,JSON.stringify(db));return true; }
    catch(err){console.warn(err);notify('Armazenamento cheio ou bloqueado. Exporte um backup.',true);return false;}
  }
  function notify(message,error=false) {
    const node=$('#toast'); if(!node)return;
    node.textContent=message;node.classList.toggle('is-error',error);node.classList.add('is-visible');
    clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>node.classList.remove('is-visible'),3200);
  }
  const monthKey = (year=db.settings.year,month=db.settings.month) => `${year}-${String(month).padStart(2,'0')}`;
  const txInMonth = (t,month=monthKey()) => t.date.startsWith(month);
  function monthData(month=monthKey()) {
    const tx=db.transactions.filter(t=>txInMonth(t,month));
    const byType = type => dec(tx.filter(t=>t.type===type).reduce((a,t)=>a+t.amount,0));
    const income=byType('Entrada'),expense=byType('Gasto'),saving=dec(byType('Reserva')-byType('Resgate'));
    return {tx,income,expense,saving,balance:dec(income-expense-saving),savingRate:income>0? saving/income*100 : 0};
  }
  function annualData() { return MONTHS.map((_,idx)=>monthData(monthKey(db.settings.year,idx+1))); }
  function savingsForGoal(id) { return dec(db.transactions.filter(t=>t.type==='Reserva'&&t.goalId===id).reduce((sum,t)=>sum+t.amount,0)); }
  function cofferTransactions(id){return db.transactions.filter(t=>t.cofferId===id);}
  function cofferBalance(c){return dec(c.initial+cofferTransactions(c.id).reduce((sum,t)=>sum+(t.type==='Reserva'?t.amount:t.type==='Resgate'?-t.amount:0),0));}
  function cofferCells(c){
    if(c.mode!=='woodbox')return [];
    const plan=WOODBOX_PLANS[c.plan]||WOODBOX_PLANS.mil;
    const count=c.plan==='custom'?c.count:plan.count;
    return Array.from({length:count},(_,i)=>dec(plan.ascending?i+1:(c.plan==='custom'?c.unit:plan.unit)));
  }
  function cofferTarget(c){return c.mode==='woodbox'?dec(cofferCells(c).reduce((a,b)=>a+b,0)):c.target;}
  function occupiedCofferSlots(c){return new Map(cofferTransactions(c.id).filter(t=>t.type==='Reserva'&&Number.isInteger(t.boxSlot)).map(t=>[t.boxSlot,t]));}
  function fixedTotal() { return dec(db.bills.filter(b=>b.active).reduce((sum,b)=>sum+b.amount,0)); }
  function activeGoalIds() {return new Set(db.goals.map(g=>g.id));}
  function render() {
    const titleMap = {painel:['Seu dinheiro, sob controle.','Acompanhe suas receitas, gastos e quanto você está conseguindo guardar.','Visão geral'],lancamentos:['Registre cada movimentação.','Tudo que entra, sai ou é separado para economizar.','Lançamentos'],orcamento:['Planeje seu orçamento.','Defina limites de gastos e mantenha seu planejamento.','Orçamento'],contas:['Suas contas em dia.','Organize os pagamentos recorrentes sem confundir previsão com gasto.','Contas fixas'],metas:['Um passo de cada vez.','Transforme seus objetivos em metas de economia.','Minhas metas'],cofrinhos:['Seu dinheiro vai ganhar destino.','Cofrinhos livres e desafios Woodbox com cartelas interativas.','Cofrinhos'],ajuda:['Aprenda a usar.','Seu guia de uso e as opções para proteger seus dados.','Como usar']};
    const header=titleMap[view];
    $('#pageTitle').textContent=header[0];$('#pageSubtitle').textContent=header[1];$('#currentCrumb').textContent=header[2];
    $$('.view').forEach(el=>el.classList.toggle('active',el.id===`view-${view}`));
    $$('[data-view]').forEach(el=>el.classList.toggle('is-active',el.dataset.view===view));
    $('#monthSelect').value=String(db.settings.month);$('#yearSelect').value=String(db.settings.year);
    if(view==='painel')renderDashboard();
    else if(view==='lancamentos')renderTransactions();
    else if(view==='orcamento')renderBudgets();
    else if(view==='contas')renderBills();
    else if(view==='metas')renderGoals();
    else if(view==='cofrinhos')renderCoffers();
  }
  function navigate(next) {
    if(!['painel','lancamentos','orcamento','contas','metas','cofrinhos','ajuda'].includes(next))return;
    view=next;
    history.replaceState(null,'',`#${next}`);
    $('#sidebar').classList.remove('open');$('#mobileShade').hidden=true;$('#mobileMenu').setAttribute('aria-expanded','false');
    render();window.scrollTo({top:0,behavior:'instant'});
  }
  function stat(label,value,sub,cls,icon,accent=false) {return `<article class="stat-card ${accent?'accent':''}"><div class="stat-header"><span class="stat-title">${label}</span><span class="stat-icon ${cls}">${icon}</span></div><div class="stat-value ${value<0?'negative':''}">${money(value)}</div><div class="stat-detail">${sub}</div></article>`;}
  function infoCard(label,value,detail='',cls=''){return `<div class="info-card"><small>${label}</small><strong>${value}</strong>${detail?`<small class="${cls}">${detail}</small>`:''}</div>`;}
  function renderDashboard() {
    const d=monthData();
    $('#summaryGrid').innerHTML = stat('Dinheiro que entrou',d.income,'Total de receitas no mês','income','↗') + stat('Gastos do mês',d.expense,'Compras e contas pagas','expense','↘') + stat('Dinheiro guardado',d.saving,'Reservas menos resgates do mês','saving','◎') + stat('Saldo disponível',d.balance,'Entradas − gastos − reservas','balance','↗',true);
    const totalGoal=Number(db.settings.monthlySavingsTarget)||0;
    const goalText=totalGoal>0?`${Math.min(999,Math.round(d.saving/totalGoal*100))}% da meta mensal`: 'Defina sua meta mensal';
    $('#dashboardMini').innerHTML=infoCard('Taxa de economia',`${d.savingRate.toFixed(1).replace('.',',')}%`,'Sobre as entradas do mês')+infoCard('Contas fixas previstas',money(fixedTotal()),'Não descontadas do saldo')+`<div class="info-card"><small>Meta para guardar no mês</small><strong>${money(totalGoal)}</strong><small>${goalText} · <button type="button" class="text-button" data-action="edit-monthly-goal">Editar meta</button></small></div>`;
    const totalInCoffers=dec(db.coffers.reduce((sum,c)=>sum+cofferBalance(c),0));
    $('#dashboardCoffers').innerHTML=`<strong>${money(totalInCoffers)}</strong><small>${db.coffers.length} cofrinho(s) criado(s)</small>`;
    renderAnnual();renderCategories(d);renderRecent(d);renderUpcomingBills();
  }
  function renderAnnual() {
    const year=annualData();let maximum=Math.max(1,...year.flatMap(d=>[d.income,d.expense,d.saving]));
    $('#chartYear').textContent=String(db.settings.year);
    $('#annualChart').innerHTML=year.map((d,i)=>`<div class="chart-month"><div class="bar-groups"><span class="bar income" style="height:${d.income/maximum*100}%" title="${SHORT_MONTHS[i]}: entradas ${esc(money(d.income))}"></span><span class="bar expense" style="height:${d.expense/maximum*100}%" title="${SHORT_MONTHS[i]}: gastos ${esc(money(d.expense))}"></span><span class="bar saving" style="height:${Math.max(0,d.saving)/maximum*100}%" title="${SHORT_MONTHS[i]}: guardado ${esc(money(d.saving))}"></span></div><span class="bar-chart-label">${SHORT_MONTHS[i]}</span></div>`).join('');
    $('#annualChart').setAttribute('aria-label',`Ano ${db.settings.year}. ${year.map((d,i)=>`${SHORT_MONTHS[i]}: entradas ${money(d.income)}, gastos ${money(d.expense)}, guardado ${money(d.saving)}`).join('; ')}`);
  }
  function renderCategories(d) {
    const cats=EXPENSE_CATS.map((cat,i)=>({name:cat,value:dec(d.tx.filter(t=>t.type==='Gasto'&&t.category===cat).reduce((s,t)=>s+t.amount,0)),color:CAT_COLORS[i]})).filter(c=>c.value>0).sort((a,b)=>b.value-a.value);
    if (!cats.length) {$('#categoryChart').innerHTML='<div class="empty-state"><span class="empty-symbol">◉</span>Registre seus gastos para visualizar<br> a distribuição por categoria.</div>';return;}
    const total=cats.reduce((s,c)=>s+c.value,0);let offset=0;
    const stops=cats.map(c=>{const from=offset;offset+=(c.value/total)*100;return `${c.color} ${from.toFixed(2)}% ${offset.toFixed(2)}%`;}).join(', ');
    $('#categoryChart').innerHTML=`<div class="donut-wrap"><div class="donut" style="background:conic-gradient(${stops})"><div class="donut-inner"><strong>${money(total)}</strong><small>Total gasto</small></div></div><div class="category-list">${cats.slice(0,6).map(c=>`<div class="category-item"><span class="category-item-label"><i class="small-dot" style="background:${c.color}"></i>${esc(c.name)}</span><b>${(100*c.value/total).toFixed(0)}%</b></div>`).join('')}</div></div>`;
  }
  function sortedTransactions(list) {return [...list].sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id));}
  function renderRecent(d) {
    const items=sortedTransactions(d.tx).slice(0,5);
    $('#recentTransactions').innerHTML=items.length?`<div class="activity-list">${items.map(t=>{const cl=t.type==='Entrada'||t.type==='Resgate'?'income':t.type==='Gasto'?'expense':'saving';return `<div class="activity-item"><span class="activity-icon ${cl}">${t.type==='Entrada'||t.type==='Resgate'?'↗':t.type==='Gasto'?'↘':'◎'}</span><div class="activity-item-content"><strong>${esc(t.description)}</strong><small>${fmtDate(t.date)} · ${esc(t.category)}</small></div><span class="activity-value ${cl}">${t.type==='Entrada'||t.type==='Resgate'?'+':t.type==='Gasto'?'-':'↘ '}${money(t.amount)}</span></div>`}).join('')}</div>`:'<div class="empty-state"><span class="empty-symbol">⇄</span>Nenhum lançamento neste mês.<br>Use “Novo lançamento” para começar.</div>';
  }
  function renderUpcomingBills() {
    const bills=db.bills.filter(b=>b.active).sort((a,b)=>a.day-b.day).slice(0,5);
    $('#upcomingBills').innerHTML=bills.length?`<div class="activity-list">${bills.map(b=>`<div class="activity-item"><span class="activity-icon">▤</span><div class="activity-item-content"><strong>${esc(b.name)}</strong><small>Dia ${String(b.day).padStart(2,'0')} · ${esc(b.category)}</small></div><span class="activity-value">${money(b.amount)}</span></div>`).join('')}</div>`:'<div class="empty-state"><span class="empty-symbol">▤</span>Você ainda não cadastrou<br>contas fixas mensais.</div>';
  }
  function renderTransactions() {
    const term=$('#transactionSearch').value.toLocaleLowerCase('pt-BR').trim();
    const type=$('#transactionTypeFilter').value;
    const all=$('#allMonthsToggle').checked;
    const goalMap=new Map(db.goals.map(g=>[g.id,g.name]));
    const cofferMap=new Map(db.coffers.map(c=>[c.id,c.name]));
    const filtered=sortedTransactions(db.transactions.filter(t=>(all||txInMonth(t))&&(type==='all'||t.type===type)&&(!term||`${t.description} ${t.category} ${t.payment} ${t.notes} ${goalMap.get(t.goalId)||''} ${cofferMap.get(t.cofferId)||''}`.toLocaleLowerCase('pt-BR').includes(term))));
    $('#transactionsBody').innerHTML=filtered.length?filtered.map(t=>{
      const cls=t.type==='Entrada'||t.type==='Resgate'?'income':t.type==='Gasto'?'expense':'saving';
      const pay=t.cofferId?(cofferMap.get(t.cofferId)||'Cofrinho removido'):t.type==='Reserva'?(goalMap.get(t.goalId)||'Sem meta definida'):(t.payment||'—');
      return `<tr><td>${fmtDate(t.date)}</td><td><div class="main-cell">${esc(t.description)}</div>${t.notes?`<div class="secondary-line">${esc(t.notes)}</div>`:''}</td><td>${esc(t.category)}</td><td><span class="pill ${cls}">${t.type==='Reserva'?'Guardado':esc(t.type)}</span></td><td>${esc(pay)}</td><td class="right currency-${cls}">${t.type==='Entrada'||t.type==='Resgate'?'+':t.type==='Gasto'?'-':''}${money(t.amount)}</td><td class="right"><div class="actions">${t.cofferId?`<button class="action-small" type="button" data-view="cofrinhos">Cofrinho</button>`:`<button class="action-small" type="button" data-edit-transaction="${esc(t.id)}" aria-label="Editar lançamento">Editar</button>`}<button class="action-small danger" type="button" data-delete-transaction="${esc(t.id)}" aria-label="Excluir lançamento">✕</button></div></td></tr>`;
    }).join(''):'<tr><td colspan="7" class="empty-row">Nenhum lançamento encontrado. Adicione um registro ou altere os filtros.</td></tr>';
    $('#transactionsFooter').textContent=`${filtered.length} lançamento(s) exibido(s) ${all?'· todos os meses':`· ${MONTHS[db.settings.month-1]} de ${db.settings.year}`}`;
  }
  function renderBudgets() {
    const budget=db.budgets[monthKey()]||{};
    const spent=Object.fromEntries(EXPENSE_CATS.map(cat=>[cat,dec(db.transactions.filter(t=>t.type==='Gasto'&&txInMonth(t)&&t.category===cat).reduce((sum,t)=>sum+t.amount,0))]));
    const setCats=EXPENSE_CATS.filter(cat=>Object.hasOwn(budget,cat));
    const limit=dec(setCats.reduce((sum,cat)=>sum+budget[cat],0));
    const spentTotal=dec(Object.values(spent).reduce((a,b)=>a+b,0));
    $('#budgetOverview').innerHTML=infoCard('Limites definidos',money(limit),`${setCats.length} de ${EXPENSE_CATS.length} categorias`)+infoCard('Gasto real do mês',money(spentTotal),'Somente lançamentos do tipo Gasto')+infoCard('Diferença planejado − gasto',money(limit-spentTotal),limit-spentTotal<0?'Acima do total definido':'Atenção às categorias sem teto',limit-spentTotal<0?'alert':'positive');
    $('#budgetRows').innerHTML=EXPENSE_CATS.map(cat=>{
      const exists=Object.hasOwn(budget,cat),target=exists?budget[cat]:0,actual=spent[cat];
      const ratio=target>0?actual/target:0;
      const percent=Math.min(100,ratio*100);
      const situation=!exists?'Sem limite':target===0?(actual>0?'Acima do teto':'Teto zero'):ratio>1?'Acima do teto':ratio>=.8?'Perto do limite':'Dentro do limite';
      const color=ratio>1||target===0&&exists&&actual>0?'over':ratio>=.8?'warn':'ok';
      return `<div class="budget-row"><div class="budget-cat">${esc(cat)}</div><input aria-label="Teto mensal de ${esc(cat)}" data-budget-cat="${esc(cat)}" type="number" min="0" max="1000000000" step="0.01" placeholder="Definir teto" value="${exists?target:''}"><div class="budget-number">${money(actual)} gastos</div><div class="budget-progress-wrap"><div class="budget-progress"><span class="${color}" style="width:${percent}%"></span></div><small>${exists?`${target>0?(ratio*100).toFixed(0):actual?'Acima do teto':'0'}% utilizado · ${money(target-actual)} disponível`:'Nenhum limite definido'}</small></div><div class="budget-status ${situation==='Acima do teto'?'over':color==='ok'&&exists?'ok':''}">${situation}</div></div>`;
    }).join('');
  }
  function renderBills() {
    const active=db.bills.filter(b=>b.active);
    $('#billsStats').innerHTML=infoCard('Total previsto no mês',money(fixedTotal()),'Não desconta do saldo')+infoCard('Contas ativas',String(active.length),`${db.bills.length} cadastradas`)+infoCard('Contas pausadas',String(db.bills.length-active.length),'Fora da previsão');
    $('#billsBody').innerHTML=db.bills.length? [...db.bills].sort((a,b)=>a.day-b.day).map(b=>`<tr><td class="main-cell">${esc(b.name)}</td><td>${esc(b.category)}</td><td>Dia ${String(b.day).padStart(2,'0')}</td><td class="right"><strong>${money(b.amount)}</strong></td><td><span class="pill ${b.active?'income':'inactive'}">${b.active?'Ativa':'Pausada'}</span></td><td class="right"><div class="actions"><button class="action-small" data-edit-bill="${esc(b.id)}" type="button">Editar</button><button class="action-small danger" data-delete-bill="${esc(b.id)}" type="button">✕</button></div></td></tr>`).join(''):'<tr><td colspan="6" class="empty-row">Nenhuma conta cadastrada. Use “Adicionar conta” para começar.</td></tr>';
  }
  function renderGoals() {
    const goalIds=activeGoalIds();
    const assigned=dec(db.transactions.filter(t=>t.type==='Reserva'&&goalIds.has(t.goalId)).reduce((sum,t)=>sum+t.amount,0));
    const unassigned=dec(db.transactions.filter(t=>t.type==='Reserva'&&!goalIds.has(t.goalId)&&!t.cofferId).reduce((sum,t)=>sum+t.amount,0));
    const initialTotal=dec(db.goals.reduce((sum,g)=>sum+g.initial,0));
    $('#goalsStats').innerHTML=infoCard('Total em metas',money(initialTotal+assigned),'Valor inicial + reservas registradas')+infoCard('Reservas sem meta',money(unassigned),'Guardado, mas sem vínculo com objetivo')+infoCard('Metas cadastradas',String(db.goals.length),'Escolha uma meta ao registrar a reserva');
    $('#goalsGrid').innerHTML=db.goals.length?db.goals.map(g=>{
      const saved=dec(g.initial+savingsForGoal(g.id));const missing=Math.max(0,dec(g.target-saved));const percentage=g.target>0?saved/g.target*100:0;
      return `<article class="goal-card"><div class="goal-card-header"><span class="goal-icon">◎</span><span class="pill ${g.target>0&&saved>=g.target?'income':'saving'}">${g.target>0&&saved>=g.target?'Meta alcançada':'Em andamento'}</span></div><div class="goal-title">${esc(g.name)}</div><div class="goal-sub">Objetivo: ${money(g.target)} · Inicial: ${money(g.initial)}</div><div class="goal-numbers"><strong>${money(saved)}</strong><span>${Math.round(percentage)}% concluído</span></div><div class="progress-track"><div class="progress-fill" style="width:${clamp(percentage,0,100)}%"></div></div><div class="goal-meta"><span>${missing>0?`Faltam ${money(missing)}`:'Objetivo alcançado'}</span><strong>${money(savingsForGoal(g.id))} em reservas</strong></div><div class="goal-actions"><button class="button button-outline" type="button" data-edit-goal="${esc(g.id)}">Editar meta</button><button class="action-small danger" type="button" data-delete-goal="${esc(g.id)}" aria-label="Excluir meta ${esc(g.name)}">✕</button></div></article>`;
    }).join(''):'<div class="panel empty-state"><span class="empty-symbol">◎</span>Nenhuma meta cadastrada.<br>Crie sua primeira meta para acompanhar quanto já guardou.</div>';
  }
  function renderCoffers() {
    const total=dec(db.coffers.reduce((sum,c)=>sum+cofferBalance(c),0));
    const target=dec(db.coffers.reduce((sum,c)=>sum+cofferTarget(c),0));
    const woodboxCount=db.coffers.filter(c=>c.mode==='woodbox').length;
    $('#cofferStats').innerHTML=infoCard('Guardado nos cofrinhos',money(total),'Inclui valores iniciais informados')+infoCard('Objetivo dos cofrinhos',money(target),'Soma das metas estabelecidas')+infoCard('Desafios Woodbox',String(woodboxCount),`${db.coffers.length} cofrinho(s) ao todo`);
    if(!db.coffers.length){
      $('#cofferList').innerHTML='<div class="panel coffer-empty"><span class="piggy-big">🐷</span><h2>Seu primeiro cofrinho começa aqui</h2><p>Crie um cofrinho livre ou escolha uma cartela Woodbox para completar cada depósito.</p><button class="button button-primary" type="button" data-action="add-coffer">+ Criar meu cofrinho</button></div>';
      $('#cofferDetails').innerHTML='';selectedCofferId=null;return;
    }
    if(!db.coffers.some(c=>c.id===selectedCofferId))selectedCofferId=db.coffers[0].id;
    $('#cofferList').innerHTML=db.coffers.map(c=>{
      const balance=cofferBalance(c), goal=cofferTarget(c), pct=goal>0?clamp(balance/goal*100,0,100):0;
      const isWood=c.mode==='woodbox';
      return `<button class="coffer-select ${isWood?'is-wood':''} ${c.id===selectedCofferId?'is-selected':''}" type="button" data-select-coffer="${esc(c.id)}" aria-pressed="${c.id===selectedCofferId}"><span class="coffer-card-top"><span class="coffer-card-icon">${isWood?'▦':'🐷'}</span><span class="coffer-type">${isWood?'DESAFIO WOODBOX':'COFRINHO LIVRE'}</span></span><strong class="coffer-card-title">${esc(c.name)}</strong><span class="coffer-card-amount">${money(balance)}</span><span class="coffer-card-meta">de ${money(goal)}</span><span class="progress-track coffer-progress"><span class="progress-fill" style="width:${pct}%"></span></span><span class="coffer-card-foot">${Math.round(pct)}% concluído <span>Abrir →</span></span></button>`;
    }).join('');
    const c=db.coffers.find(x=>x.id===selectedCofferId);
    const balance=cofferBalance(c), goal=cofferTarget(c), remaining=Math.max(0,dec(goal-balance)), pct=goal>0?clamp(balance/goal*100,0,100):0;
    const actions=`<div class="coffer-title-actions">${c.mode==='woodbox'?'<button class="button button-outline" type="button" data-action="print-woodbox">Imprimir cartela</button>':''}<button class="button button-outline" type="button" data-edit-coffer="${esc(c.id)}">Editar</button><button class="action-small danger" type="button" data-delete-coffer="${esc(c.id)}">Excluir</button></div>`;
    if(c.mode==='woodbox') {
      const cells=cofferCells(c), marks=occupiedCofferSlots(c);
      const sumMarked=dec([...marks.values()].reduce((sum,t)=>sum+t.amount,0));
      const remainingBoxes=cells.length-marks.size;
      $('#cofferDetails').innerHTML=`<section class="panel coffer-detail woodbox-detail"><div class="coffer-detail-heading"><div><span class="eyebrow">CARTELA INTERATIVA</span><h2>🪵 ${esc(c.name)}</h2><p>Selecione uma casa para confirmar que guardou o valor mostrado nela.</p></div>${actions}</div>
      <div class="woodbox-stats"><div><small>Total do desafio</small><strong>${money(goal)}</strong></div><div><small>Depósitos marcados</small><strong>${marks.size} / ${cells.length}</strong></div><div><small>Guardado nas casas</small><strong>${money(sumMarked)}</strong></div><div><small>Faltam nas casas</small><strong>${money(dec(goal-sumMarked))}</strong></div></div>
      <div class="woodbox-tools"><label>Data do depósito <input type="date" id="cofferDepositDate" value="${today()}" aria-label="Data do depósito Woodbox"></label><span class="woodbox-note">Clique numa casa livre para registrar o depósito; clique na casa marcada para desfazer o registro. Cada casa vale exatamente o valor exibido.</span></div>
      <div class="wooden-frame"><div class="wooden-label"><span>WOODBOX</span><small>Marque cada conquista</small></div><div class="woodbox-grid" aria-label="Cartela de depósitos Woodbox">${cells.map((value,index)=>{const marked=marks.has(index);return `<button type="button" data-coffer-cell="${esc(c.id)}" data-slot="${index}" class="woodbox-cell ${marked?'is-marked':''}" aria-pressed="${marked}" title="Casa ${index+1}: ${money(value)} · ${marked?'depositado':'a depositar'}"><span class="cell-number">${index+1}</span><strong>${money(value).replace('R$','R$')}</strong><span class="cell-check">${marked?'✓':'○'}</span></button>`;}).join('')}</div><p class="woodbox-frame-footer">Só marque um valor quando o dinheiro tiver sido realmente separado. <strong>${remainingBoxes} casa(s) pendente(s)</strong>.</p></div>
      <p class="coffer-explain">Os depósitos da Woodbox são lançados automaticamente como <strong>Reserva</strong> e já aparecem no painel. Não registre novamente o mesmo valor em “Lançamentos”. ${c.plan==='trintamil'?'Nesta cartela, as 300 casas representam parcelas de R$ 100 cada.':''}</p>
      </section>`;
    } else {
      const records=sortedTransactions(cofferTransactions(c.id));
      $('#cofferDetails').innerHTML=`<section class="panel coffer-detail"><div class="coffer-detail-heading"><div><span class="eyebrow">POUPANÇA PERSONALIZADA</span><h2>🐷 ${esc(c.name)}</h2><p>Guarde quando puder e retire quando precisar. Tudo fica no histórico.</p></div>${actions}</div><div class="free-coffer-hero"><div><small>Saldo atual neste cofrinho</small><strong>${money(balance)}</strong><span>Faltam ${money(remaining)} para seu objetivo</span></div><div class="free-coffer-target"><span>${Math.round(pct)}% da meta</span><strong>${money(goal)}</strong><div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div></div></div>
      <div class="coffer-controls"><button class="button button-primary" type="button" data-coffer-move="${esc(c.id)}" data-move-type="deposit">+ Depositar</button><button class="button button-outline" type="button" data-coffer-move="${esc(c.id)}" data-move-type="withdraw" ${balance<=0?'disabled':''}>− Retirar</button></div>
      <div class="coffer-history"><h3>Movimentações do cofrinho</h3>${records.length?records.slice(0,15).map(t=>`<div class="coffer-history-line"><div><strong>${esc(t.description)}</strong><small>${fmtDate(t.date)}</small></div><b class="${t.type==='Resgate'?'currency-expense':'currency-income'}">${t.type==='Resgate'?'-':'+'}${money(t.amount)}</b></div>`).join(''):'<p>Ainda não há depósitos. O valor inicial, caso informado, já está no saldo e não é um lançamento do mês.</p>'}</div><p class="coffer-explain">Depósitos são registrados como Reserva. Retiradas são Resgates: voltam ao saldo disponível, mas <strong>não são novas receitas</strong>.</p></section>`;
    }
  }
  function handleCofferCell(cofferId,slot,date) {
    const c=db.coffers.find(c=>c.id===cofferId&&c.mode==='woodbox');if(!c)return;
    const cells=cofferCells(c);if(!Number.isInteger(slot)||slot<0||slot>=cells.length)return;
    const existing=occupiedCofferSlots(c).get(slot);
    if(existing){
      if(!confirm(`Desfazer o depósito da casa ${slot+1} (${money(existing.amount)})? O lançamento será removido do histórico.`))return;
      const old=db.transactions;db.transactions=old.filter(t=>t.id!==existing.id);
      if(!save()){db.transactions=old;return;}render();notify('Depósito desmarcado e lançamento removido.');return;
    }
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(new Date(`${date}T12:00:00`).getTime())){notify('Escolha uma data válida.',true);return;}
    const amount=cells[slot];if(!(amount>0)){notify('Valor de depósito inválido.',true);return;}
    if(!confirm(`Você já separou ${money(amount)} de verdade para a casa ${slot+1}?\nConfirmar depósito em ${fmtDate(date)}?`))return;
    const record={id:uid(),date,type:'Reserva',category:'Economia',description:`Woodbox · ${c.name} · casa ${slot+1}`,payment:'',amount,goalId:'',cofferId:c.id,boxSlot:slot,notes:'Depósito confirmado na cartela Woodbox'};
    db.transactions.push(record);if(!save()){db.transactions.pop();return;}render();notify(`Casa ${slot+1} concluída! ${money(amount)} guardados.`);
  }
  function deleteCoffer(id) {
    const c=db.coffers.find(x=>x.id===id);if(!c)return;
    if(!confirm(`Excluir o cofrinho "${c.name}"? Os depósitos e resgates continuarão no histórico financeiro, mas perderão o vínculo com este cofrinho. Faça backup antes, se necessário.`))return;
    db.coffers=db.coffers.filter(x=>x.id!==id);
    db.transactions.forEach(t=>{if(t.cofferId===id){t.cofferId='';t.boxSlot=null;}});
    selectedCofferId=db.coffers[0]?.id||null;save();render();notify('Cofrinho excluído. Histórico financeiro preservado.');
  }
  const field = (name,label,html,wide=false,help='') => `<div class="form-field ${wide?'wide':''}"><label for="form-${name}">${label}</label>${html}${help?`<p class="field-help">${help}</p>`:''}</div>`;
  const input = (name,type,value,required=false,extra='') => `<input id="form-${name}" name="${name}" type="${type}" ${required?'required':''} ${extra} value="${esc(value)}">`;
  const select = (name,values,value,extra='') => `<select id="form-${name}" name="${name}" ${extra}>${values.map(v=>`<option value="${esc(v[0])}" ${v[0]===value?'selected':''}>${esc(v[1])}</option>`).join('')}</select>`;
  const choices=arr=>arr.map(c=>[c,c]);
  function openModal(kind,id=null,operation='deposit') {
    previousFocus=document.activeElement;
    editing={kind,id,operation};
    const found=kind==='transaction'?db.transactions.find(x=>x.id===id):kind==='bill'?db.bills.find(x=>x.id===id):kind==='goal'?db.goals.find(x=>x.id===id):kind==='coffer'||kind==='cofferMove'?db.coffers.find(x=>x.id===id):null;
    if(id&&!found)return;
    if(kind==='transaction'&&found?.cofferId){notify('Movimentações do cofrinho são gerenciadas na aba Cofrinhos.',true);return;}
    $('#dialogEyebrow').textContent=id?'EDITAR REGISTRO':'NOVO REGISTRO';
    if(kind==='transaction'){
      const t=found||{date:today(),type:'Gasto',category:'Alimentação',description:'',payment:'Pix',amount:'',goalId:'',notes:''};
      $('#dialogTitle').textContent=id?'Editar lançamento':'Novo lançamento';
      $('#formFields').innerHTML = field('date','Data *',input('date','date',t.date,true)) + field('type','Tipo *',select('type',choices(t.type==='Resgate'?['Resgate']:['Entrada','Gasto','Reserva']),t.type,'required')) + field('description','Descrição *',input('description','text',t.description,true,'maxlength="120" placeholder="Ex.: Supermercado"'),true) + field('category','Categoria *',`<select id="form-category" name="category" required></select>`) + field('payment','Forma de pagamento',select('payment',choices(PAYMENTS),t.payment)) + field('amount','Valor (R$) *',input('amount','number',t.amount,true,'min="0.01" max="1000000000" step="0.01" placeholder="0,00"')) + field('goalId','Vincular a uma meta',select('goalId',[['','Sem meta definida'],...db.goals.map(g=>[g.id,g.name])],t.goalId),true,'Só será utilizado para lançamentos do tipo Reserva.') + field('notes','Observações',`<textarea id="form-notes" name="notes" maxlength="300" placeholder="Opcional">${esc(t.notes)}</textarea>`,true);
      refreshTransactionFields(t.category);
      $('#form-type').addEventListener('change',()=>refreshTransactionFields(null));
    } else if(kind==='bill') {
      const b=found||{name:'',category:'Contas',day:10,amount:'',active:true};
      $('#dialogTitle').textContent=id?'Editar conta fixa':'Nova conta fixa';
      $('#formFields').innerHTML=field('name','Nome da conta *',input('name','text',b.name,true,'maxlength="100" placeholder="Ex.: Internet"'),true)+field('category','Categoria',select('category',choices(EXPENSE_CATS),b.category))+field('day','Dia do vencimento *',input('day','number',b.day,true,'min="1" max="31" step="1"'))+field('amount','Valor previsto (R$) *',input('amount','number',b.amount,true,'min="0.01" max="1000000000" step="0.01"'))+field('active','Situação',select('active',[['true','Ativa'],['false','Pausada']],String(b.active)),true,'Previsões não são descontadas automaticamente do saldo.');
    } else if(kind==='goal') {
      const g=found||{name:'',target:'',initial:0};
      $('#dialogTitle').textContent=id?'Editar meta':'Nova meta';
      $('#formFields').innerHTML=field('name','Nome da meta *',input('name','text',g.name,true,'maxlength="100" placeholder="Ex.: Casa, Emergência"'),true)+field('target','Quanto quer guardar (R$) *',input('target','number',g.target,true,'min="0.01" max="1000000000" step="0.01"'))+field('initial','Quanto já tinha guardado (R$)',input('initial','number',g.initial,false,'min="0" max="1000000000" step="0.01"'),false,'Saldo anterior: não entra no dinheiro recebido deste mês.');
    } else if(kind==='coffer') {
      const c=found||{name:'',mode:'free',target:'',initial:0,plan:'mil',count:100,unit:10};
      $('#dialogTitle').textContent=id?'Editar cofrinho':'Criar cofrinho';
      const hasDeposits=!!(id&&cofferTransactions(id).length);
      const modeselect=select('mode',[['free','Cofrinho livre'],['woodbox','Desafio Woodbox']],c.mode,hasDeposits?'disabled':'');
      $('#formFields').innerHTML=field('name','Nome do cofrinho *',input('name','text',c.name,true,'maxlength="100" placeholder="Ex.: Minha reserva"'),true)
       +field('mode','Modelo',modeselect,true,hasDeposits?'Para proteger o histórico, o tipo não pode mudar depois do primeiro lançamento.':'Você escolhe entre depósitos livres ou casas marcadas.')
       +field('target','Objetivo (R$) *',input('target','number',c.target||'',false,'min="0.01" max="1000000000" step="0.01" placeholder="Ex.: 3000"'))
       +field('initial','Valor já guardado antes (R$)',input('initial','number',c.initial||0,false,'min="0" max="1000000000" step="0.01"'),false,'Não entra como receita ou depósito deste mês.')
       +field('plan','Escolha o desafio',select('plan',Object.entries(WOODBOX_PLANS).map(([id,p])=>[id,p.name]),c.plan),true)
       +field('count','Quantidade de casas',input('count','number',c.count,false,'min="1" max="500" step="1"'))
       +field('unit','Depósito por casa (R$)',input('unit','number',c.unit,false,'min="0.01" max="1000000000" step="0.01"'))
       +`<div class="form-field wide"><p class="field-help" id="cofferPreview"></p></div>`;
      if(hasDeposits&&c.mode==='woodbox')$('#form-plan').disabled=true;
      const refresh=()=>refreshCofferForm(c);
      ['mode','plan','count','unit'].forEach(x=>$('#form-'+x).addEventListener('change',refresh));
      ['count','unit'].forEach(x=>$('#form-'+x).addEventListener('input',refresh));
      refresh();
    } else if(kind==='cofferMove') {
      if(found.mode!=='free')return;
      const withdraw=operation==='withdraw';
      $('#dialogTitle').textContent=withdraw?'Retirar do cofrinho':'Depositar no cofrinho';
      $('#formFields').innerHTML=field('date','Data *',input('date','date',today(),true))+field('amount','Valor (R$) *',input('amount','number','',true,'min="0.01" max="1000000000" step="0.01" placeholder="0,00"'))+`<div class="form-field wide"><p class="field-help">${withdraw?`Saldo disponível para resgatar: ${money(cofferBalance(found))}. Retiradas não são novas receitas.`:`O depósito será lançado automaticamente como Reserva e descontado do saldo disponível do mês.`}</p></div>`;
    }
    $('#modalOverlay').hidden=false;document.body.style.overflow='hidden';
    setTimeout(()=>{const el=$('#entityForm input, #entityForm select');if(el)el.focus()},10);
  }
  function refreshCofferForm(c) {
    const wood=$('#form-mode').value==='woodbox';
    const custom=$('#form-plan').value==='custom';
    ['target','initial'].forEach(name=>{$('#form-'+name).closest('.form-field').hidden=wood;});
    $('#form-plan').closest('.form-field').hidden=!wood;
    ['count','unit'].forEach(name=>{$('#form-'+name).closest('.form-field').hidden=!wood||!custom;});
    const name=$('#form-plan').value,plan=WOODBOX_PLANS[name];
    const count=custom?Number($('#form-count').value):plan?.count;
    const unit=custom?Number($('#form-unit').value):plan?.unit;
    const target=count>0?(plan?.ascending?count*(count+1)/2:count*(unit||0)):0;
    $('#cofferPreview').textContent=wood?`Cartela: ${Number(count)||0} casas · objetivo total ${money(target)}. Os depósitos só são contabilizados quando você marca cada casa.`:'Cofrinho livre: defina uma meta, deposite e retire quando precisar.';
  }
  function refreshTransactionFields(oldCategory=null) {
    const type=$('#form-type').value;
    const categories=type==='Entrada'?INCOME_CATS:type==='Reserva'||type==='Resgate'?['Economia']:EXPENSE_CATS;
    const category=$('#form-category');
    category.innerHTML=choices(categories).map(([value,label])=>`<option value="${esc(value)}" ${oldCategory===value?'selected':''}>${esc(label)}</option>`).join('');
    const goal=$('#form-goalId');
    goal.disabled=type!=='Reserva';
    goal.closest('.form-field').style.display=type==='Reserva'?'grid':'none';
    if(type!=='Reserva')goal.value='';
  }
  function closeModal() {$('#modalOverlay').hidden=true;document.body.style.overflow='';editing=null;if(previousFocus?.focus)previousFocus.focus();}
  function parseAmount(value,positive=true) {const v=Number(value);return Number.isFinite(v)&&v>=(positive?0.01:0)&&v<=1e9?dec(v):null;}
  function foundMode(id,coffers,proposed) {
    const existing=coffers.find(c=>c.id===id);
    return existing&&cofferTransactions(id).length ? existing.mode : (proposed==='woodbox'?'woodbox':'free');
  }
  function handleSubmit(event) {
    event.preventDefault();if(!editing)return;
    const form=$('#entityForm');
    if(!form.reportValidity())return;
    const fields=Object.fromEntries(new FormData(form).entries());
    const kind=editing.kind,id=editing.id;
    if(kind==='transaction'){
      const amount=parseAmount(fields.amount);
      if(amount===null || !/^\d{4}-\d{2}-\d{2}$/.test(fields.date)||Number.isNaN(new Date(`${fields.date}T12:00:00`).getTime())){notify('Informe uma data e um valor válido maior que zero.',true);return;}
      if(!fields.description.trim()){notify('Preencha a descrição.',true);return;}
      const record={id:id||uid(),date:fields.date,type:fields.type,category:fields.category,description:fields.description.trim().slice(0,120),payment:fields.type==='Reserva'?'':fields.payment,amount,goalId:fields.type==='Reserva'?fields.goalId||'':'',cofferId:'',boxSlot:null,notes:fields.notes?.trim().slice(0,300)||''};
      if(id)db.transactions=db.transactions.map(t=>t.id===id?record:t);else db.transactions.push(record);
    }else if(kind==='bill'){
      const amount=parseAmount(fields.amount),day=Number(fields.day);
      if(!fields.name.trim()||amount===null||!Number.isInteger(day)||day<1||day>31){notify('Preencha nome, dia de 1 a 31 e valor maior que zero.',true);return;}
      const record={id:id||uid(),name:fields.name.trim().slice(0,100),category:fields.category,day,amount,active:fields.active==='true'};
      if(id)db.bills=db.bills.map(b=>b.id===id?record:b);else db.bills.push(record);
    }else if(kind==='goal'){
      const target=parseAmount(fields.target),initial=parseAmount(fields.initial||0,false);
      if(!fields.name.trim()||target===null||initial===null){notify('Preencha nome e objetivo válidos.',true);return;}
      const record={id:id||uid(),name:fields.name.trim().slice(0,100),target,initial};
      if(id)db.goals=db.goals.map(g=>g.id===id?record:g);else db.goals.push(record);
    } else if(kind==='coffer') {
      const name=fields.name?.trim();if(!name){notify('Dê um nome ao cofrinho.',true);return;}
      const mode=foundMode(id,db.coffers,fields.mode);
      if(mode==='free'){
        const target=parseAmount(fields.target),initial=parseAmount(fields.initial||0,false);
        if(target===null||initial===null){notify('Informe uma meta válida e um saldo inicial maior ou igual a zero.',true);return;}
        const current=id?db.coffers.find(c=>c.id===id):null;
        const otherMovement=current?cofferTransactions(id).reduce((a,t)=>a+(t.type==='Reserva'?t.amount:t.type==='Resgate'?-t.amount:0),0):0;
        if(initial+otherMovement<0){notify('O saldo inicial não pode ficar abaixo das retiradas já feitas.',true);return;}
        const record={id:id||uid(),name:name.slice(0,100),mode,target,initial,plan:'mil',count:100,unit:10};
        if(id)db.coffers=db.coffers.map(c=>c.id===id?record:c);else db.coffers.push(record);
      }else{
        const current=id?db.coffers.find(c=>c.id===id):null;
        const locked=!!(current&&cofferTransactions(id).length);
        const plan=locked?current.plan:fields.plan;
        if(!WOODBOX_PLANS[plan]){notify('Escolha um desafio válido.',true);return;}
        const count=locked?current.count:Number(fields.count);
        const unit=locked?current.unit:parseAmount(fields.unit);
        if(plan==='custom'&&(!Number.isInteger(count)||count<1||count>500||unit===null)){notify('Escolha de 1 a 500 casas e valor por casa maior que zero.',true);return;}
        const record={id:id||uid(),name:name.slice(0,100),mode:'woodbox',target:0,initial:0,plan,count:plan==='custom'?count:(WOODBOX_PLANS[plan].count),unit:plan==='custom'?unit:(WOODBOX_PLANS[plan].unit||0)};
        if(cofferTarget(record)>1e9){notify('O objetivo do desafio excede o limite permitido.',true);return;}
        if(id)db.coffers=db.coffers.map(c=>c.id===id?record:c);else db.coffers.push(record);
      }
      selectedCofferId=id||db.coffers[db.coffers.length-1].id;
    }else if(kind==='cofferMove') {
      const c=db.coffers.find(c=>c.id===id&&c.mode==='free');if(!c)return;
      const amount=parseAmount(fields.amount);
      if(amount===null||!/^\d{4}-\d{2}-\d{2}$/.test(fields.date)||Number.isNaN(new Date(`${fields.date}T12:00:00`).getTime())){notify('Data ou valor inválido.',true);return;}
      const withdraw=editing.operation==='withdraw';
      if(withdraw&&amount>cofferBalance(c)){notify('O resgate não pode exceder o saldo do cofrinho.',true);return;}
      db.transactions.push({id:uid(),date:fields.date,type:withdraw?'Resgate':'Reserva',category:'Economia',description:`${withdraw?'Retirada':'Depósito'} · ${c.name}`,payment:'',amount,goalId:'',cofferId:c.id,boxSlot:null,notes:''});
    }
    const succeeded=save();closeModal();render();if(succeeded)notify(id?'Registro atualizado!':'Registro adicionado!');
  }
  function removeEntity(kind,id) {
    const group=kind==='transaction'?'transactions':kind==='bill'?'bills':'goals';
    const record=db[group].find(x=>x.id===id);if(!record)return;
    const desc=record.description||record.name;
    if(!confirm(`Excluir "${desc}"? Esta ação não pode ser desfeita.`))return;
    db[group]=db[group].filter(x=>x.id!==id);
    // Reservas ligadas a metas removidas continuam salvas como reservas sem meta.
    if(kind==='goal')db.transactions.forEach(t=>{if(t.goalId===id)t.goalId=''});
    save();render();notify('Registro excluído.');
  }
  function saveBudget(inputEl) {
    const cat=inputEl.dataset.budgetCat;
    if(!EXPENSE_CATS.includes(cat))return;
    const key=monthKey();const value=inputEl.value.trim();
    const number=Number(value);
    if(value!==''&&(!Number.isFinite(number)||number<0||number>1e9)){notify('Informe um teto válido (zero ou maior).',true);renderBudgets();return;}
    if(!db.budgets[key])db.budgets[key]={};
    if(value==='')delete db.budgets[key][cat];else db.budgets[key][cat]=dec(number);
    save();renderBudgets();notify('Limite mensal salvo.');
  }
  function copyBudget() {
    const previous=new Date(db.settings.year,db.settings.month-2,1);
    const sourceKey=monthKey(previous.getFullYear(),previous.getMonth()+1);
    const src=db.budgets[sourceKey];
    if(!src||!Object.keys(src).length){notify('Não há limites cadastrados no mês anterior.',true);return;}
    if(!confirm(`Copiar os limites de ${MONTHS[previous.getMonth()]} para ${MONTHS[db.settings.month-1]} de ${db.settings.year}? Isso substitui os limites do mês atual.`))return;
    db.budgets[monthKey()]={...src};save();renderBudgets();notify('Limites copiados.');
  }
  function editMonthlyGoal() {
    const current=db.settings.monthlySavingsTarget;
    const answer=prompt('Qual valor você deseja guardar por mês? (R$)\nDigite 0 para retirar a meta.',String(current));
    if(answer===null)return;
    const parsed=parseAmount(answer.replace(',','.'),false);
    if(parsed===null){notify('Digite um valor válido, como 300 ou 300,50.',true);return;}
    db.settings.monthlySavingsTarget=parsed;save();renderDashboard();notify('Meta mensal atualizada.');
  }
  function downloadFile(name,content,type) {
    const blob=new Blob([content],{type});
    const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  function backupFilename() { return `controle-financeiro-backup-${today().replaceAll('-','')}.json`; }
  function backupExport() {
    // Download explícito: nunca salvar dados privados no repositório do GitHub.
    downloadFile(backupFilename(),JSON.stringify(db,null,2),'application/json;charset=utf-8');
    notify('Backup do dia gerado! Guarde o arquivo JSON em local privado.');
  }
  async function backupShare() {
    // Compartilhar só depois de clique do usuário. Web Share API depende do navegador/HTTPS.
    const file=new File([JSON.stringify(db,null,2)],backupFilename(),{type:'application/json'});
    if(typeof navigator.share!=='function'||typeof navigator.canShare!=='function'||!navigator.canShare({files:[file]})) {
      backupExport();
      notify('Backup baixado. Envie o JSON por um meio privado e importe no outro aparelho.');
      return;
    }
    try {
      await navigator.share({title:'Backup Meu Controle Financeiro',files:[file]});
      notify('Compartilhamento solicitado ao dispositivo.');
    }catch(err){
      if(err?.name==='AbortError')return;
      notify('Compartilhamento indisponível. Baixe o backup e envie o arquivo manualmente.',true);
    }
  }
  let backupPreviousFocus=null;
  function openBackupCenter() {
    if(!$('#modalOverlay').hidden)closeModal();
    backupPreviousFocus=document.activeElement;
    $('#backupOverlay').hidden=false;
    document.body.classList.add('backup-dialog-open');
    $('#backupCloseButton').focus();
  }
  function closeBackupCenter() {
    if($('#backupOverlay').hidden)return;
    $('#backupOverlay').hidden=true;
    document.body.classList.remove('backup-dialog-open');
    if(backupPreviousFocus?.isConnected)backupPreviousFocus.focus();
    backupPreviousFocus=null;
  }
  async function backupImport(file) {
    if(!file)return;
    try {
      if(file.size>15e6)throw new Error('Arquivo muito grande (limite de 15 MB).');
      const candidate=normalize(JSON.parse(await file.text()));
      if(!confirm('Importar este backup? TODOS os dados deste navegador serão substituídos pelos do arquivo. Exporte seus dados atuais antes de continuar.'))return;
      const previous=db;db=candidate;
      if(!save()){db=previous;return;}
      render();closeBackupCenter();notify('Backup importado com sucesso.');
    }catch(err){notify(err.message||'Não foi possível importar o backup.',true);}finally{$('#backupFile').value='';}
  }
  function csvProtect(value) {
    let s=String(value??'');
    // Evita que textos fornecidos pelo usuário sejam interpretados como fórmulas no Excel.
    if(/^[\s]*[=+@\-]/.test(s))s="'"+s;
    return `"${s.replace(/"/g,'""')}"`;
  }
  function exportCSV() {
    const header=['Data','Tipo','Categoria','Descrição','Forma de pagamento','Valor (R$)','Meta','Cofrinho','Observações'];
    const goalMap=new Map(db.goals.map(g=>[g.id,g.name]));
    const cofferMap=new Map(db.coffers.map(c=>[c.id,c.name]));
    const rows=sortedTransactions(db.transactions).map(t=>[fmtDate(t.date),t.type,t.category,t.description,t.payment,t.amount.toFixed(2).replace('.',','),goalMap.get(t.goalId)||'',cofferMap.get(t.cofferId)||'',t.notes]);
    const text='\ufeff'+[header,...rows].map(row=>row.map(csvProtect).join(';')).join('\r\n');
    downloadFile(`lancamentos-${today()}.csv`,text,'text/csv;charset=utf-8');notify('CSV exportado para abrir no Excel.');
  }
  function init() {
    load();
    $('#monthSelect').innerHTML=MONTHS.map((m,i)=>`<option value="${i+1}">${m}</option>`).join('');
    document.querySelector('.brand').addEventListener('click',e=>{e.preventDefault();navigate('painel');});
    $('#monthSelect').addEventListener('change',e=>{db.settings.month=Number(e.target.value);save();render();});
    $('#yearSelect').addEventListener('change',e=>{const n=Number(e.target.value);if(Number.isInteger(n)&&n>=2000&&n<=2100){db.settings.year=n;save();render();}else{e.target.value=db.settings.year;notify('Escolha um ano entre 2000 e 2100.',true);}});
    $('#transactionSearch').addEventListener('input',()=>{if(view==='lancamentos')renderTransactions()});
    $('#transactionTypeFilter').addEventListener('change',()=>{if(view==='lancamentos')renderTransactions()});
    $('#allMonthsToggle').addEventListener('change',()=>{if(view==='lancamentos')renderTransactions()});
    $('#copyPreviousBudget').addEventListener('click',copyBudget);
    $('#entityForm').addEventListener('submit',handleSubmit);
    $('#closeModal').addEventListener('click',closeModal);$('#cancelModal').addEventListener('click',closeModal);
    $('#modalOverlay').addEventListener('click',e=>{if(e.target.id==='modalOverlay')closeModal()});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#modalOverlay').hidden)closeModal()});
    // Ações de backup existentes na página Ajuda continuam disponíveis.
    $('#backupExport').addEventListener('click',backupExport);$('#csvExport').addEventListener('click',exportCSV);
    $('#backupImport').addEventListener('click',()=>$('#backupFile').click());
    $('#backupFile').addEventListener('change',e=>backupImport(e.target.files[0]));
    // Atalhos de acesso rápido no cabeçalho, em qualquer tela (PC e celular).
    $('#dailyBackupButton').addEventListener('click',backupExport);
    $('#backupCenterButton').addEventListener('click',openBackupCenter);
    $('#backupCloseButton').addEventListener('click',closeBackupCenter);
    $('#backupOverlay').addEventListener('click',e=>{if(e.target.id==='backupOverlay')closeBackupCenter()});
    $('#backupSaveNow').addEventListener('click',backupExport);
    $('#backupShareNow').addEventListener('click',backupShare);
    $('#backupRestoreNow').addEventListener('click',()=>$('#backupFile').click());
    $('#backupCsvNow').addEventListener('click',exportCSV);
    document.addEventListener('keydown',e=>{
      if($('#backupOverlay').hidden)return;
      if(e.key==='Escape'){e.preventDefault();closeBackupCenter();}
      if(e.key==='Tab'){
        const focusables=Array.from($('#backupOverlay').querySelectorAll('button:not([disabled])'));
        if(!focusables.length)return;
        const first=focusables[0],last=focusables[focusables.length-1];
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
      }
    });
    $('#mobileMenu').addEventListener('click',()=>{const opened=$('#sidebar').classList.toggle('open');$('#mobileShade').hidden=!opened;$('#mobileMenu').setAttribute('aria-expanded',String(opened))});
    $('#mobileShade').addEventListener('click',()=>{$('#sidebar').classList.remove('open');$('#mobileShade').hidden=true;$('#mobileMenu').setAttribute('aria-expanded','false')});
    document.addEventListener('click',e=>{
      const elem=e.target.closest('button[data-view],button[data-action],[data-select-coffer],[data-coffer-cell],[data-coffer-move],[data-edit-coffer],[data-delete-coffer],[data-edit-transaction],[data-delete-transaction],[data-edit-bill],[data-delete-bill],[data-edit-goal],[data-delete-goal]');
      if(!elem)return;
      if(elem.dataset.view){navigate(elem.dataset.view);return;}
      if(elem.dataset.selectCoffer){selectedCofferId=elem.dataset.selectCoffer;renderCoffers();return;}
      if(elem.dataset.cofferCell){handleCofferCell(elem.dataset.cofferCell,Number(elem.dataset.slot),$('#cofferDepositDate')?.value||today());return;}
      if(elem.dataset.cofferMove){openModal('cofferMove',elem.dataset.cofferMove,elem.dataset.moveType);return;}
      if(elem.dataset.editCoffer){openModal('coffer',elem.dataset.editCoffer);return;}
      if(elem.dataset.deleteCoffer){deleteCoffer(elem.dataset.deleteCoffer);return;}
      const action=elem.dataset.action;
      if(action==='add-transaction')openModal('transaction');else if(action==='add-bill')openModal('bill');else if(action==='add-goal')openModal('goal');else if(action==='add-coffer')openModal('coffer');else if(action==='print-woodbox')window.print();else if(action==='edit-monthly-goal')editMonthlyGoal();
      const types=[['editTransaction','transaction',true],['deleteTransaction','transaction',false],['editBill','bill',true],['deleteBill','bill',false],['editGoal','goal',true],['deleteGoal','goal',false]];
      for(const [attr,kind,edit] of types){if(elem.dataset[attr]){(edit?openModal:removeEntity)(kind,elem.dataset[attr]);break;}}
    });
    document.addEventListener('change',e=>{if(e.target.matches('[data-budget-cat]'))saveBudget(e.target)});
    const validHash=location.hash.slice(1);
    view=['painel','lancamentos','orcamento','contas','metas','cofrinhos','ajuda'].includes(validHash)?validHash:'painel';
    render();
  }
  init();
})();
