/* Meu Controle Financeiro | Cotações de criptomoedas e fontes de referência
 * Arquivo independente: edite aqui serviços, links e ativos.
 * Nada é enviado a CoinMarketCap/Gecko além do ativo que está sendo consultado.
 * Nunca coloque chaves privadas de API em um site público do GitHub Pages.
 */
(function (root) {
  'use strict';
  const ASSETS = Object.freeze({
    BTC: {gecko:'bitcoin', cmc:'1', paprika:'btc-bitcoin', slug:'bitcoin'},
    ETH: {gecko:'ethereum', cmc:'1027', paprika:'eth-ethereum', slug:'ethereum'},
    SOL: {gecko:'solana', cmc:'5426', paprika:'sol-solana', slug:'solana'},
    USDT:{gecko:'tether', cmc:'825', paprika:'usdt-tether', slug:'tether'},
    USDC:{gecko:'usd-coin', cmc:'3408', paprika:'usdc-usd-coin', slug:'usd-coin'},
    BNB: {gecko:'binancecoin', cmc:'1839', paprika:'bnb-binance-coin', slug:'bnb'},
    DOGE:{gecko:'dogecoin', cmc:'74', paprika:'doge-dogecoin', slug:'dogecoin'},
    ADA: {gecko:'cardano', cmc:'2010', paprika:'ada-cardano', slug:'cardano'},
    XRP: {gecko:'ripple', cmc:'52', paprika:'xrp-xrp', slug:'xrp'},
    LTC: {gecko:'litecoin', cmc:'2', paprika:'ltc-litecoin', slug:'litecoin'}
  });
  const PROVIDERS=Object.freeze({auto:'Automática (fontes alternativas)',coingecko:'CoinGecko',coinmarketcap:'CoinMarketCap',coinpaprika:'CoinPaprika'});
  const validProvider=s=>Object.prototype.hasOwnProperty.call(PROVIDERS,s)?s:'auto';
  const validPrice=n=>Number.isFinite(Number(n))&&Number(n)>0?Number(n):null;
  function normalizePrice(rate,date,source) {
    const p=validPrice(rate);
    if(p===null)throw new Error('Cotação não disponível neste provedor.');
    return {rate:p, date:String(date||'não informada'),source};
  }
  async function fromGecko(info,getJSON) {
    const response=await getJSON(`https://api.coingecko.com/api/v3/simple/price?ids=${info.gecko}&vs_currencies=usd&include_last_updated_at=true`);
    const record=response?.[info.gecko];
    const timestamp=Number(record?.last_updated_at);
    return normalizePrice(record?.usd,Number.isFinite(timestamp)&&timestamp>0?new Date(timestamp*1000).toISOString():'não informada','CoinGecko');
  }
  async function fromCMC(info,getJSON) {
    // Endpoint público keyless. Se bloqueado por CORS / rede, o modo automático usa outra fonte.
    const response=await getJSON(`https://pro-api.coinmarketcap.com/public-api/v2/simple/price?id=${info.cmc}&convert=USD&include_last_updated=true`);
    if(response?.status&&Number(response.status.error_code)!==0)throw new Error('CoinMarketCap não retornou cotação válida.');
    const asset=Array.isArray(response?.data)?response.data.find(a=>String(a.id)===info.cmc):null;
    const quote=asset?.quotes?.find(q=>q.symbol==='USD');
    return normalizePrice(quote?.price,quote?.last_updated||response?.status?.timestamp,'CoinMarketCap');
  }
  async function fromPaprika(info,getJSON) {
    const response=await getJSON(`https://api.coinpaprika.com/v1/tickers/${info.paprika}`);
    return normalizePrice(response?.quotes?.USD?.price,response?.last_updated,'CoinPaprika');
  }
  async function priceUSD(symbol,provider,getJSON) {
    const info=ASSETS[symbol];
    if(!info)throw new Error('Criptomoeda não reconhecida.');
    const selected=validProvider(provider);
    const sequence=selected==='auto'?['coingecko','coinmarketcap','coinpaprika']:[selected];
    const functions={coingecko:fromGecko,coinmarketcap:fromCMC,coinpaprika:fromPaprika};
    let lastError;
    for(const source of sequence){
      try{return await functions[source](info,getJSON);}catch(err){lastError=err;}
    }
    if(selected==='auto')throw new Error('Nenhuma fonte de cripto respondeu. Tente atualizar mais tarde.');
    throw new Error(`${PROVIDERS[selected]} indisponível no navegador. Experimente a fonte Automática. ${lastError?.message||''}`.trim());
  }
  function referenceLinks(symbol) {
    const info=ASSETS[symbol];
    return [
      {name:'CoinGecko',url:info?`https://www.coingecko.com/pt-br/moedas/${info.gecko}`:'https://www.coingecko.com/pt'},
      {name:'CoinMarketCap',url:info?`https://coinmarketcap.com/currencies/${info.slug}/`:'https://coinmarketcap.com/'},
      {name:'Investing.com',url:'https://br.investing.com/currencies/'},
      {name:'Frankfurter',url:'https://frankfurter.dev/'},
      {name:'CoinPaprika',url:info?`https://coinpaprika.com/coin/${info.paprika}/`:'https://coinpaprika.com/'}
    ];
  }
  root.KaykoCotacoes=Object.freeze({ASSETS,PROVIDERS,validProvider,priceUSD,referenceLinks});
})(typeof window!=='undefined'?window:globalThis);
