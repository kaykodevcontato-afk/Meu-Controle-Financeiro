/* Relatório completo | Dev Kayko | GitHub Pages | Sem envio a servidores.
   Para editar: títulos em sections(), visual em styles(), cálculo em totals(). */
(function(root){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const brl=v=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(v)||0);
const num=v=>new Intl.NumberFormat('pt-BR',{maximumFractionDigits:8}).format(Number(v)||0);
const date=v=>/^\d{4}-\d{2}-\d{2}$/.test(v||'')?v.slice(8,10)+'/'+v.slice(5,7)+'/'+v.slice(0,4):'—';
const period=v=>/^\d{4}-\d{2}$/.test(v||'')?v.slice(5,7)+'/'+v.slice(0,4):'—';
const row=(...cells)=>'<tr>'+cells.map(c=>'<td>'+esc(c)+'</td>').join('')+'</tr>';
const table=(heads,rows)=>'<div class="tablewrap"><table><thead><tr>'+heads.map(h=>'<th>'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+(rows.length?rows.join(''):'<tr><td colspan="'+heads.length+'">Nenhum registro.</td></tr>')+'</tbody></table></div>';
const section=(title,body,sub='')=>'<section><h2>'+esc(title)+'</h2>'+(sub?'<p class="help">'+esc(sub)+'</p>':'')+body+'</section>';
const sum=(items,t)=>items.reduce((v,x)=>v+(x.type===t?Number(x.amount)||0:0),0);
const totals=items=>{const income=sum(items,'Entrada'),expense=sum(items,'Gasto'),reserves=sum(items,'Reserva'),withdraw=sum(items,'Resgate');return {income,expense,reserves,withdraw,saved:reserves-withdraw,available:income-expense-reserves+withdraw}};
const cofferBalance=(c,tx)=>Number(c.initial||0)+tx.filter(t=>t.cofferId===c.id).reduce((v,t)=>v+(t.type==='Reserva'?Number(t.amount)||0:t.type==='Resgate'?-(Number(t.amount)||0):0),0);
const kpi=(title,value)=>'<div class="kpi"><small>'+esc(title)+'</small><strong>'+esc(value)+'</strong></div>';
function build(db){
 const tx=Array.isArray(db.transactions)?db.transactions:[];
 const bills=Array.isArray(db.bills)?db.bills:[];
 const coffers=Array.isArray(db.coffers)?db.coffers:[];
 const goals=Array.isArray(db.goals)?db.goals:[];
 const wallets=Array.isArray(db.wallets)?db.wallets:[];
 const investments=Array.isArray(db.investments)?db.investments:[];
 const budgets=db.budgets||{};
 const month=String(db.settings?.year||new Date().getFullYear())+'-'+String(db.settings?.month||new Date().getMonth()+1).padStart(2,'0');
 const mt=tx.filter(t=>(t.date||'').startsWith(month));const m=totals(mt);const all=totals(tx);
 const created=new Date().toLocaleString('pt-BR');
 let sections='';
 sections+=section('Resumo financeiro', '<div class="kpis">'+kpi('Entradas no mês '+period(month),brl(m.income))+kpi('Gastos no mês',brl(m.expense))+kpi('Reservado líquido no mês',brl(m.saved))+kpi('Saldo calculado do mês',brl(m.available))+kpi('Entradas em todo o histórico',brl(all.income))+kpi('Gastos em todo o histórico',brl(all.expense))+kpi('Reservas líquidas no histórico',brl(all.saved))+kpi('Saldo calculado no histórico',brl(all.available))+'</div>', 'Os saldos são calculados pelos lançamentos cadastrados. Valores iniciais de metas, investimentos e aplicativos não são somados às receitas.');
 const monthly=[...new Set(tx.map(t=>(t.date||'').slice(0,7)).filter(v=>/^\d{4}-\d{2}$/.test(v)))].sort();
 sections+=section('Movimentação por mês',table(['Mês','Entradas','Gastos','Reservas líquidas','Saldo calculado'],monthly.map(k=>{const z=totals(tx.filter(t=>t.date.startsWith(k)));return row(period(k),brl(z.income),brl(z.expense),brl(z.saved),brl(z.available))})));
 sections+=section('Todos os lançamentos',table(['Data','Tipo','Descrição','Categoria','Forma','Valor','Observações'],[...tx].sort((a,b)=>(a.date||'').localeCompare(b.date||'')).map(t=>row(date(t.date),t.type,t.description,t.category,t.payment,brl(t.amount),t.notes||''))),'Inclui todos os meses, não apenas o período selecionado.');
 const keys=Object.keys(budgets).sort();const budgetRows=keys.flatMap(k=>Object.entries(budgets[k]||{}).map(([cat,lim])=>{const spent=tx.filter(t=>t.type==='Gasto'&&t.category===cat&&(t.date||'').startsWith(k)).reduce((v,t)=>v+(Number(t.amount)||0),0);return row(period(k),cat,brl(lim),brl(spent),brl(Number(lim)-spent));}));
 sections+=section('Orçamento por categoria',table(['Mês','Categoria','Limite','Gasto','Disponível / excedido'],budgetRows));
 sections+=section('Contas fixas e pagamentos',table(['Conta','Categoria','Dia','Valor','Situação','Meses marcados pagos'],bills.map(b=>row(b.name,b.category,b.day,brl(b.amount),b.active===false?'Pausada':'Ativa',(b.paidMonths||[]).map(period).join(', ')||'Nenhum'))),'Uma conta marcada como paga não gera automaticamente lançamento de gasto. Os meses pagos são exibidos separadamente.');
 sections+=section('Metas de economia',table(['Meta','Objetivo','Saldo inicial','Reservas vinculadas','Total estimado'],goals.map(g=>{const r=tx.filter(t=>t.goalId===g.id&&t.type==='Reserva').reduce((s,t)=>s+(Number(t.amount)||0),0);return row(g.name,brl(g.target),brl(g.initial),brl(r),brl(Number(g.initial||0)+r))})));
 sections+=section('Cofrinhos e Woodbox',table(['Cofrinho','Modalidade','Meta cadastrada','Saldo inicial','Saldo calculado'],coffers.map(c=>row(c.name,c.mode==='woodbox'?'Woodbox':'Livre',c.mode==='woodbox'?'Conforme cartela':brl(c.target),brl(c.initial),brl(cofferBalance(c,tx))))),'Saldos estimados a partir dos registros; rendimento simulado de CDI/Tesouro não entra no saldo.');
 sections+=section('Apps, pontos e criptomoedas',table(['Aplicativo','Tipo','Quantidade / saldo','Moeda','Valor de 1 ponto ou regra'],wallets.map(w=>row(w.app,w.kind==='points'?'Pontos':w.kind==='crypto'?'Criptomoeda':'Saldo',num(w.balance),w.currency,w.kind==='points'?(w.pointValueMode==='BRL'?'R$ '+num(w.pointUnitValue)+' por ponto':w.pointValueMode==='USD'?'US$ '+num(w.pointUnitValue)+' por ponto':num(w.pointsPerUsd)+' pontos por US$ 1'):'—'))),'Valores externos são registros manuais. Não representam saldo bancário nem preços de mercado em tempo real.');
 sections+=section('Investimentos e trade',table(['Ativo','Quantidade','Preço de compra','Moeda','Observações'],investments.map(i=>row(i.symbol||i.ticker||i.name||i.asset||'—',num(i.quantity??i.qty),num(i.buyPrice??i.price??i.averagePrice),(i.currency||({'PETR4':'BRL','VALE3':'BRL','ITUB4':'BRL','MGLU3':'BRL','BOVA11':'BRL','IVVB11':'BRL'}[i.symbol]||'USD')),i.notes||''))),'Carteira manual: confira os preços e a moeda no cadastro. Este relatório não atualiza cotações nem garante rendimento.');
 sections+=section('Preferências e observações','<p>Meta de economia mensal: <strong>'+esc(brl(db.settings?.monthlySavingsTarget))+'</strong>. Mês selecionado: '+esc(period(month))+'.</p><p>Relatório gerado localmente no navegador, sem envio dos seus dados para servidores. Os valores refletem somente os registros disponíveis neste navegador no momento da geração.</p>');
 return {html:sections,created};
}
function styles(){return `*{box-sizing:border-box}body{font:12px/1.5 Arial,Helvetica,sans-serif;color:#162136;background:#f1f5fa;margin:0}header{background:#0e2945;color:white;padding:23px 30px}header h1{font-size:25px;margin:0 0 4px}header p{color:#d4e5f5;margin:0}.toolbar{display:flex;gap:12px;padding:13px 24px;background:#dfe9f7;position:sticky;top:0;z-index:5}.toolbar button{background:#126d9c;border:0;border-radius:8px;padding:10px 18px;color:white;font-weight:700;cursor:pointer}.toolbar button.secondary{background:#49576c}main{max-width:1150px;margin:22px auto 50px;padding:0 16px}section{background:#fff;border:1px solid #dae3ed;border-radius:9px;padding:18px 20px;margin:0 0 18px;break-inside:avoid-page}h2{font-size:17px;color:#17466f;margin:0 0 12px;border-bottom:1px solid #e3ebf2;padding-bottom:8px}.help{color:#526477}.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.kpi{border:1px solid #d5e2ed;border-radius:7px;padding:12px}.kpi small{display:block;color:#51677e}.kpi strong{font-size:17px}table{width:100%;border-collapse:collapse;table-layout:auto}th,td{border:1px solid #d9e2ed;padding:7px;text-align:left;overflow-wrap:anywhere;vertical-align:top}th{background:#eaf1fa}tbody tr:nth-child(even){background:#f7f9fc}.tablewrap{overflow-x:auto}footer{text-align:center;color:#65768a;padding:18px}@page{size:A4;margin:13mm}@media print{body{background:#fff;font-size:9pt}header{padding:10px 0;background:white!important;color:#152b43}header p{color:#3f5265}.toolbar{display:none}main{margin:0;padding:0;max-width:none}section{border:0;border-radius:0;padding:10px 0;margin:0;break-inside:auto}section h2{break-after:avoid}table{font-size:8pt}thead{display:table-header-group}tr{break-inside:avoid}th,td{padding:4px}th{background:#eee!important}.kpis{grid-template-columns:repeat(4,1fr)}footer{display:none}}@media(max-width:650px){.kpis{grid-template-columns:repeat(2,1fr)}main{padding:0 8px}section{padding:12px 8px}}`}
function abrir(db){
 const popup=window.open('','_blank');if(!popup)return false;
 const r=build(db);
 const html='<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Relatório financeiro completo — Dev Kayko</title><style>'+styles()+'</style></head><body><header><h1>Meu Controle Financeiro — Relatório completo</h1><p>Dev Kayko · Gerado em '+esc(r.created)+'</p></header><div class="toolbar"><button type="button" onclick="window.print()">Imprimir / Salvar como PDF</button><button type="button" class="secondary" onclick="window.close()">Fechar</button></div><main>'+r.html+'</main><footer>Relatório confidencial — não compartilhe sem verificar os dados.</footer></body></html>';
 popup.document.open();popup.document.write(html);popup.document.close();popup.focus();return true;
}
root.KaykoRelatorio={abrir,build};
})(window);
