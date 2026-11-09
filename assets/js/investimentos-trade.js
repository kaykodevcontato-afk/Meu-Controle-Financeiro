/*
 * Meu Controle Financeiro | Investimentos & Trade — Dev Kayko
 * Edição: lista de ativos em ATIVOS, fontes em consultarCotacoes(), cálculos em simular().
 * Controle e simulação exclusivamente locais. NÃO envia ordens, não compra ativos.
 * Preços estáticos datados são EXEMPLOS HISTÓRICOS e nunca usados como preço atual da carteira.
 * Só consulte APIs públicas. NÃO coloque token ou chave de corretora no GitHub Pages.
 */
(function (root) {
  'use strict';
  const ATIVOS = Object.freeze([
    {symbol:'PETR4',name:'Petrobras PN',group:'b3',currency:'BRL',kind:'Ação B3',whole:true,quote:'brapi',reference:45.36,referenceDate:'2026-11-06',url:'https://www.google.com/finance/quote/PETR4:BVMF',about:'Empresa brasileira de energia. Exposição a petróleo, mas NÃO ao preço direto do barril.'},
    {symbol:'VALE3',name:'Vale ON',group:'b3',currency:'BRL',kind:'Ação B3',whole:true,quote:'brapi',reference:64.04,referenceDate:'2026-11-06',url:'https://www.google.com/finance/quote/VALE3:BVMF',about:'Mineradora: exposição a commodities, especialmente minério de ferro.'},
    {symbol:'ITUB4',name:'Itaú Unibanco PN',group:'b3',currency:'BRL',kind:'Ação B3',whole:true,quote:'brapi',reference:40.53,referenceDate:'2026-11-06',url:'https://www.google.com/finance/quote/ITUB4:BVMF',about:'Ação do setor financeiro brasileiro.'},
    {symbol:'MGLU3',name:'Magazine Luiza ON',group:'b3',currency:'BRL',kind:'Ação B3',whole:true,quote:'brapi',reference:5.61,referenceDate:'2026-11-06',url:'https://www.google.com/finance/quote/MGLU3:BVMF',about:'Ação de varejo; resultados e preço sujeitos a forte oscilação.'},
    {symbol:'BOVA11',name:'ETF Ibovespa',group:'etf',currency:'BRL',kind:'ETF B3',whole:true,reference:165.93,referenceDate:'2026-11-06',url:'https://www.google.com/finance/quote/BOVA11:BVMF',about:'Cesta que acompanha o Ibovespa. Possui taxas e risco de mercado.'},
    {symbol:'IVVB11',name:'ETF S&P 500 em reais',group:'etf',currency:'BRL',kind:'ETF B3',whole:true,reference:459.00,referenceDate:'2026-11-06',url:'https://www.google.com/finance/quote/IVVB11:BVMF',about:'Exposição a ações americanas e ao câmbio. Não equivale a comprar Apple diretamente.'},
    {symbol:'AAPL',name:'Apple',group:'eua',currency:'USD',kind:'Ação EUA',whole:false,reference:342.37,referenceDate:'2026-11-06',url:'https://investor.apple.com/stock-price/default.aspx',about:'Uma ação inteira custa sua cotação em USD. Algumas corretoras vendem frações.'},
    {symbol:'MSFT',name:'Microsoft',group:'eua',currency:'USD',kind:'Ação EUA',whole:false,reference:530.61,referenceDate:'2026-11-06',url:'https://www.google.com/finance/quote/MSFT:NASDAQ',about:'Ação de tecnologia americana. Algumas corretoras disponibilizam frações.'},
    {symbol:'USO',name:'United States Oil Fund (petróleo WTI)',group:'petroleo',currency:'USD',kind:'Fundo listado EUA',whole:true,reference:148.41,referenceDate:'2026-11-06',url:'https://www.uscfinvestments.com/uso',about:'Exposição por futuros de petróleo WTI. Não é barril físico e pode divergir do petróleo à vista.'},
    {symbol:'BTC',name:'Bitcoin',group:'cripto',currency:'USD',kind:'Criptomoeda',whole:false,quote:'cripto',url:'https://www.coingecko.com/pt/moedas/bitcoin',about:'Pode comprar frações. Mínimo depende da plataforma e forma de pagamento.'},
    {symbol:'ETH',name:'Ethereum',group:'cripto',currency:'USD',kind:'Criptomoeda',whole:false,quote:'cripto',url:'https://www.coingecko.com/pt/moedas/ethereum',about:'Pode comprar frações. Preço e taxas variam bastante.'}
  ]);
  const GROUPS=Object.freeze({all:'Todos',b3:'Ações B3',etf:'ETFs',eua:'Ações EUA',petroleo:'Petróleo',cripto:'Cripto'});
  const VALID = new Map(ATIVOS.map(a=>[a.symbol,a]));
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=(n,c='BRL')=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:c,maximumFractionDigits:2}).format(Number(n)||0);
  const number=(n,d=6)=>new Intl.NumberFormat('pt-BR',{maximumFractionDigits:d}).format(Number(n)||0);
  const valid=(v,min=0,max=1e12)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
  const precision=v=>Math.round(v*1e8)/1e8;
  const dateOK=v=>/^\d{4}-\d{2}-\d{2}$/.test(v);
  const get=id=>document.getElementById(id);
  const day=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  let api=null, section=null, quotes=new Map(), fxAuto=null, fxAsOf='', filter='all', editingId=null, busy=false;

  function normalizeRecords(list){
    if (!Array.isArray(list)) return [];
    return list.slice(0,500).filter(x=>x&&VALID.has(x.symbol)).map(x=>({
      id:String(x.id||'').slice(0,90)||`${Date.now()}-${Math.random()}`,
      symbol:x.symbol,
      quantity:valid(x.quantity,0.00000001,1e10)?precision(x.quantity):0,
      buyPrice:valid(x.buyPrice,0.00000001,1e10)?precision(x.buyPrice):0,
      currentPrice:valid(x.currentPrice,0.00000001,1e10)?precision(x.currentPrice):0,
      date:dateOK(x.date)?x.date:day(),
      notes:String(x.notes||'').slice(0,120)
    })).filter(x=>x.quantity>0&&x.buyPrice>0);
  }
  function normalizeSettings(s){
    const v=s&&typeof s==='object'&&!Array.isArray(s)?s:{};
    return {usdBrl:valid(v.usdBrl,0,1000)?precision(v.usdBrl):0};
  }
  function config(){return api.getSettings()||normalizeSettings(null);}
  function fx(){return config().usdBrl>0?config().usdBrl:fxAuto;}
  function quoteOf(symbol){return quotes.get(symbol)||null;}
  function candidateValue(asset,manual){
    const q=quoteOf(asset.symbol);if(q?.price>0)return {price:q.price,origin:q.source,stamp:q.stamp};
    if(manual>0)return {price:manual,origin:'Cotação informada manualmente',stamp:'sem atualização automática'};
    return null;
  }
  function asBrl(value,currency){return currency==='BRL'?value:(fx()>0?value*fx():null);}
  function updateSettings(value){api.saveSettings(normalizeSettings(value));}

  function assetOptions(){return ATIVOS.map(a=>`<option value="${a.symbol}">${a.symbol} · ${esc(a.name)}</option>`).join('');}
  function mount(handlers){
    api=handlers;
    section=get('view-investimentos');
    get('invAssetFilter').addEventListener('change',e=>{filter=Object.hasOwn(GROUPS,e.target.value)?e.target.value:'all';renderMarket();});
    get('invRefreshQuotes').addEventListener('click',()=>void refreshQuotes());
    get('invGetFx').addEventListener('click',()=>void refreshFx());
    get('invUsdBrl').addEventListener('change',e=>{
      const n=Number(e.target.value);
      if(e.target.value!==''&&(!Number.isFinite(n)||n<0||n>1000)){api.notify('Informe um câmbio válido ou deixe vazio para consulta automática.',true);return;}
      updateSettings({...config(),usdBrl:n||0});renderFx();renderPortfolio();renderScenario();
    });
    get('invScenarioAsset').innerHTML=assetOptions();
    get('invPositionAsset').innerHTML=assetOptions();
    ['invScenarioAsset','invScenarioAmount','invScenarioPrice','invScenarioChange'].forEach(id=>get(id).addEventListener(id==='invScenarioAsset'?'change':'input',()=>{
      if(id==='invScenarioAsset')resetScenarioPrice();
      renderScenario();
    }));
    get('invScenarioAsset').addEventListener('change',renderScenario);
    get('invPositionAsset').addEventListener('change',()=>{get('invPositionCurrency').textContent=VALID.get(get('invPositionAsset').value)?.currency||'BRL';});
    get('invPositionForm').addEventListener('submit',savePosition);
    get('invCancelEdit').addEventListener('click',resetPosition);
    section.addEventListener('click',e=>{
      const edit=e.target.closest('[data-inv-edit]');
      const del=e.target.closest('[data-inv-delete]');
      const choice=e.target.closest('[data-inv-simulate]');
      if(edit){editPosition(edit.dataset.invEdit);return;}
      if(del){deletePosition(del.dataset.invDelete);return;}
      if(choice){get('invScenarioAsset').value=choice.dataset.invSimulate;resetScenarioPrice();renderScenario();get('invSimulator').scrollIntoView({behavior:'smooth',block:'center'});}
    });
    resetPosition();resetScenarioPrice();render();
  }
  function render(){if(!section)return;renderMarket();renderPortfolio();renderFx();renderScenario();}
  function renderMarket(){
    const target=get('invMarketCards');
    target.innerHTML=ATIVOS.filter(a=>filter==='all'||a.group===filter).map(a=>{
      const q=quoteOf(a.symbol);
      const display=q?`${money(q.price,a.currency)}`:a.reference?`${money(a.reference,a.currency)}`:'Não disponível';
      const info=q?`${esc(q.source)} · ${esc(q.stamp)} · pode haver atraso`:a.reference?`Fechamento histórico de ${a.referenceDate.split('-').reverse().join('/')} · NÃO é cotação atual`:'Abra a cotação para verificar o preço da unidade';
      const min=q?.price||a.reference||0;
      const initial=a.group==='cripto'?'Frações; mínimo varia por plataforma':a.group==='eua'?'1 ação ou fração (corretora), mínimo conforme a instituição':min?`1 unidade ≈ ${money(min,a.currency)} (referência)`:'1 ação/cota; preço depende do pregão';
      return `<article class="invest-market-card"><div class="invest-market-top"><span class="invest-ticker">${a.symbol}</span><span class="invest-type">${esc(a.kind)}</span></div><h3>${esc(a.name)}</h3><div class="invest-price">${display}</div><small class="invest-price-source">${info}</small><div class="invest-min"><strong>Entrada:</strong> ${esc(initial)}</div><p>${esc(a.about)}</p><div class="invest-card-actions"><button type="button" class="button button-outline button-small" data-inv-simulate="${a.symbol}">Simular</button><a class="button button-outline button-small" href="${esc(a.url)}" target="_blank" rel="noopener noreferrer">Ver cotação ↗</a></div></article>`;
    }).join('');
  }
  function renderFx(){
    const input=get('invUsdBrl');
    if(document.activeElement!==input)input.value=config().usdBrl||'';
    const source=config().usdBrl>0?'Taxa digitada por você':fxAuto>0?`Referência Frankfurter · ${fxAsOf||'consulta recente'}`:'Câmbio ainda não consultado';
    get('invFxStatus').textContent=fx()>0?`US$ 1 ≈ ${money(fx(),'BRL')} · ${source}. Cotação indicativa; pode diferir da corretora.`:source+' · conversões em reais dos ativos em dólar ficarão indisponíveis.';
  }
  function renderPortfolio(){
    const records=api.getRecords();
    let investedBRL=0,valuedBRL=0,priced=0,unconverted=0;
    const rows=records.map(r=>{
      const a=VALID.get(r.symbol);if(!a)return '';
      const cost=r.quantity*r.buyPrice;
      const q=candidateValue(a,r.currentPrice);
      const present=q?r.quantity*q.price:null;
      const gain=q?present-cost:null;
      const unit=money(r.buyPrice,a.currency);
      const rate=(asBrl(cost,a.currency));
      if(rate!==null)investedBRL+=rate; else unconverted++;
      if(present!==null){const converted=asBrl(present,a.currency);if(converted!==null){valuedBRL+=converted;priced++;}}
      const gainStyle=gain===null?'':gain>=0?'invest-positive':'invest-negative';
      const gainText=gain===null?'Sem cotação':`${gain>=0?'+':''}${money(gain,a.currency)} (${gain>=0?'+':''}${(gain/cost*100).toFixed(2).replace('.',',')}%)`;
      return `<tr><td class="invest-holding-name"><strong>${esc(r.symbol)}</strong><small>${esc(a.name)} · ${esc(r.date)}</small></td><td>${number(r.quantity,8)}</td><td>${unit}</td><td>${money(cost,a.currency)}</td><td>${present===null?'—':money(present,a.currency)}<small class="invest-cell-detail">${esc(q?.origin||'Sem cotação')}</small></td><td class="${gainStyle}">${gainText}</td><td class="invest-table-actions"><button class="action-small" type="button" data-inv-edit="${esc(r.id)}">Editar</button><button class="action-small danger" type="button" data-inv-delete="${esc(r.id)}">Excluir</button></td></tr>`;
    });
    get('invHoldingsRows').innerHTML=rows.length?rows.join(''):'<tr><td colspan="7" class="empty-row">Nenhum investimento registrado. Preencha o formulário para acompanhar posições de outras corretoras.</td></tr>';
    get('invPortfolioSummary').innerHTML=`<div class="invest-kpi"><span>Posições registradas</span><strong>${records.length}</strong></div><div class="invest-kpi"><span>Custo total convertido em R$</span><strong>${money(investedBRL)}</strong><small>${unconverted?'Parcial: faltou câmbio para '+unconverted+' posição(ões).':'Soma dos preços médios cadastrados, sem taxas.'}</small></div><div class="invest-kpi"><span>Valor com preço disponível (R$)</span><strong>${priced?money(valuedBRL):'—'}</strong><small>${priced} de ${records.length} posição(ões) com preço e câmbio. Não inclui as sem cotação.</small></div>`;
  }
  function resetScenarioPrice(){
    const a=VALID.get(get('invScenarioAsset').value)||ATIVOS[0];
    const q=quoteOf(a.symbol);
    get('invScenarioPrice').value=q?.price||a.reference||'';
    get('invScenarioPriceLabel').textContent=q?`Preço consultado: ${q.source} (${q.stamp})`:a.reference?`Preço histórico ${a.referenceDate.split('-').reverse().join('/')} — confira antes de investir.`:'Digite um preço consultado numa fonte externa.';
    get('invScenarioCurrency').textContent=a.currency;
  }
  function simular(symbol,amount,price,change){
    const a=VALID.get(symbol);
    if(!a||![amount,price,change].every(Number.isFinite)||amount<0||amount>1e12||price<=0||price>1e12||change< -100||change>5000)return null;
    const quantity=a.whole?Math.floor(amount/price):Math.floor(amount/price*1e8)/1e8;
    const invested=quantity*price;
    const futurePrice=price*(1+change/100);
    return {quantity,invested,rest:Math.max(0,amount-invested),futureValue:quantity*futurePrice,gain:quantity*(futurePrice-price),asset:a};
  }
  function renderScenario(){
    const a=VALID.get(get('invScenarioAsset').value)||ATIVOS[0];
    get('invScenarioCurrency').textContent=a.currency;
    const amount=Number(get('invScenarioAmount').value),price=Number(get('invScenarioPrice').value),change=Number(get('invScenarioChange').value);
    const r=simular(a.symbol,amount,price,change);
    if(!r){get('invScenarioResult').innerHTML='<p class="invest-hint">Informe um valor, uma cotação positiva e uma variação entre −100% e +5.000%.</p>';return;}
    const classe=r.gain>=0?'invest-positive':'invest-negative';
    const toBrl=asBrl(r.futureValue,a.currency);
    get('invScenarioResult').innerHTML=`<div class="invest-sim-stats"><div><small>Quantidade estimada</small><strong>${number(r.quantity,8)} ${a.whole?'unid.':'unid./frações'}</strong></div><div><small>Valor usado</small><strong>${money(r.invested,a.currency)}</strong></div><div><small>Valor hipotético</small><strong>${money(r.futureValue,a.currency)}</strong></div><div><small>Lucro/prejuízo hipotético</small><strong class="${classe}">${r.gain>=0?'+':''}${money(r.gain,a.currency)}</strong></div></div><p class="invest-hint">Restante não investido: ${money(r.rest,a.currency)}.${r.quantity<=0?' Valor insuficiente para 1 unidade inteira deste ativo.':''} ${toBrl!==null&&a.currency==='USD'?`Valor hipotético convertido: ${money(toBrl)} usando o câmbio indicado.`:''} Variação de ${number(change,2)}% é um <strong>cenário escolhido por você</strong>, NÃO um rendimento previsto. Ignora taxas, impostos, spread e dividendos.</p>`;
  }
  function resetPosition(){
    editingId=null;get('invPositionForm').reset();get('invPositionDate').value=day();
    get('invPositionSubmit').textContent='Adicionar à carteira';get('invCancelEdit').hidden=true;
    get('invPositionCurrency').textContent=VALID.get(get('invPositionAsset').value)?.currency||'BRL';
  }
  function editPosition(id){
    const record=api.getRecords().find(r=>r.id===id);if(!record)return;
    editingId=id;
    get('invPositionAsset').value=record.symbol;
    get('invPositionQty').value=record.quantity;
    get('invPositionBuyPrice').value=record.buyPrice;
    get('invPositionCurrentPrice').value=record.currentPrice||'';
    get('invPositionDate').value=record.date;
    get('invPositionNotes').value=record.notes;
    get('invPositionCurrency').textContent=VALID.get(record.symbol).currency;
    get('invPositionSubmit').textContent='Salvar alterações';get('invCancelEdit').hidden=false;
    get('invPositionForm').scrollIntoView({behavior:'smooth',block:'center'});
  }
  function savePosition(e){
    e.preventDefault();const data=new FormData(e.currentTarget);
    const symbol=data.get('symbol'),a=VALID.get(symbol),quantity=Number(data.get('quantity')),buyPrice=Number(data.get('buyPrice')),currentRaw=String(data.get('currentPrice')||'');
    const currentPrice=currentRaw.trim()===''?0:Number(currentRaw),date=String(data.get('date')||''),notes=String(data.get('notes')||'').trim().slice(0,120);
    if(!a||!valid(quantity,0.00000001,1e10)||!valid(buyPrice,0.00000001,1e10)||!valid(currentPrice,0,1e10)||!dateOK(date)){
      api.notify('Verifique ativo, data, quantidade e preços. Quantidade e custo devem ser maiores que zero.',true);return;
    }
    if(a.whole&&!Number.isInteger(quantity)){api.notify('Para este ativo, informe uma quantidade inteira de ações/cotas.',true);return;}
    const records=api.getRecords().slice();
    if(records.length>=500&&!editingId){api.notify('Limite de 500 posições atingido.',true);return;}
    const record={id:editingId||((root.crypto&&root.crypto.randomUUID)?root.crypto.randomUUID():`${Date.now()}-${Math.random()}`),symbol,quantity:precision(quantity),buyPrice:precision(buyPrice),currentPrice:precision(currentPrice),date,notes};
    if(editingId){const index=records.findIndex(r=>r.id===editingId);if(index<0)return;records[index]=record;}else records.push(record);
    api.saveRecords(records);resetPosition();renderPortfolio();api.notify('Posição salva localmente e incluída no backup JSON.');
  }
  function deletePosition(id){
    const records=api.getRecords(),record=records.find(r=>r.id===id);if(!record)return;
    if(!root.confirm(`Excluir a posição ${record.symbol} da carteira? Nenhum dinheiro real será movimentado.`))return;
    api.saveRecords(records.filter(r=>r.id!==id));if(editingId===id)resetPosition();renderPortfolio();api.notify('Posição removida do controle.');
  }
  async function requestJSON(url){
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),9000);
    try{const response=await fetch(url,{signal:controller.signal,cache:'no-store',headers:{'Accept':'application/json'}});if(!response.ok)throw new Error(String(response.status));return await response.json();}
    finally{clearTimeout(timer);}
  }
  async function refreshFx(){
    const btn=get('invGetFx');btn.disabled=true;
    get('invFxStatus').textContent='Consultando USD/BRL...';
    try{
      const res=await requestJSON('https://api.frankfurter.dev/v1/latest?base=USD&symbols=BRL');
      const value=Number(res?.rates?.BRL);if(!valid(value,0.01,1000))throw Error('Taxa inválida');
      fxAuto=value;fxAsOf=String(res.date||'');renderFx();renderPortfolio();renderScenario();
    }catch(err){renderFx();api.notify('Não foi possível obter USD/BRL. Informe a taxa manualmente.',true);}
    finally{btn.disabled=false;}
  }
  async function refreshQuotes(){
    if(busy)return;busy=true;const btn=get('invRefreshQuotes');btn.disabled=true;
    const status=get('invQuoteStatus');status.textContent='Consultando B3 e cripto...';
    const promiseB3=ATIVOS.filter(a=>a.quote==='brapi').map(async a=>{
      try{
        const data=await requestJSON(`https://brapi.dev/api/quote/${encodeURIComponent(a.symbol)}`);
        const obj=data?.results?.find(q=>q.symbol===a.symbol),price=Number(obj?.regularMarketPrice);
        if(!valid(price,0.0000001,1e10))throw Error('Preço inválido');
        const stamp=obj?.regularMarketTime?new Date(Number(obj.regularMarketTime)*1000).toLocaleString('pt-BR'):new Date().toLocaleString('pt-BR');
        quotes.set(a.symbol,{price,source:'brapi.dev / B3 (pode haver atraso)',stamp});return true;
      }catch{return false;}
    });
    const promiseCrypto=ATIVOS.filter(a=>a.quote==='cripto').map(async a=>{
      try{
        const res=await root.KaykoCotacoes.priceUSD(a.symbol,'auto',requestJSON);
        if(!valid(res.rate,0.0000001,1e10))throw Error('Preço inválido');
        quotes.set(a.symbol,{price:res.rate,source:res.source,stamp:res.date});return true;
      }catch{return false;}
    });
    const results=await Promise.all([...promiseB3,...promiseCrypto]);const count=results.filter(Boolean).length;
    if(count)status.textContent=`${count} de ${results.length} cotações consultadas. Pode haver atraso; confirme antes de negociar.`;
    else status.textContent='APIs indisponíveis ou bloqueadas pelo navegador. Use os links de cotação e preços manuais.';
    busy=false;btn.disabled=false;renderMarket();renderPortfolio();resetScenarioPrice();renderScenario();
  }
  root.KaykoInvestimentos=Object.freeze({ATIVOS,GROUPS,normalizeRecords,normalizeSettings,simular,mount,render});
})(typeof window!=='undefined'?window:globalThis);
