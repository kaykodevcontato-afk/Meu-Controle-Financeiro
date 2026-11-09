/* ==========================================================
   SIMULADOR DE RENDIMENTOS — Meu Controle Financeiro
   Edite aqui: taxas de exemplo, matemática, consulta ao BCB.
   CDI é um índice, não um produto em si. O Tesouro Selic
   está aproximado pela Selic efetiva e não por preço do título.
   Sem mudanças nas transações, cofrinhos ou saldo bancário.
   ========================================================== */
(function (global) {
  'use strict';
  const WORK_DAYS_YEAR = 252;
  const WORK_DAYS_MONTH = 21; // Convenção aproximada; não é calendário de feriados.
  const EXAMPLE_RATE = 10;    // Taxas fictícias/iniciais; NÃO são cotação atual.
  const BCB_URL = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs.';

  const DEFAULTS = Object.freeze({
    source: 'manual', principal: 1000,
    cdiAnnual: EXAMPLE_RATE, selicAnnual: EXAMPLE_RATE, cdiPercent: 100,
    periodUnit: 'months', periodCount: 1,
    rateSource: 'example', rateDate: ''
  });
  const limited = (v, min, max, fallback) => {
    const n = Number(v);
    return Number.isFinite(n) && n >= min && n <= max ? n : fallback;
  };
  const normalize = value => {
    const v = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    return {
      source: v.source === 'manual' || /^coffer:[a-zA-Z0-9_-]{1,150}$/.test(String(v.source)) ? String(v.source) : DEFAULTS.source,
      principal: limited(v.principal, 0, 1e12, DEFAULTS.principal),
      cdiAnnual: limited(v.cdiAnnual, 0, 100, DEFAULTS.cdiAnnual),
      selicAnnual: limited(v.selicAnnual, 0, 100, DEFAULTS.selicAnnual),
      cdiPercent: limited(v.cdiPercent, 0, 200, DEFAULTS.cdiPercent),
      periodUnit: v.periodUnit === 'days' ? 'days' : 'months',
      periodCount: Math.floor(limited(v.periodCount, 1, 2520, DEFAULTS.periodCount)),
      rateSource: v.rateSource === 'bcb' ? 'bcb' : v.rateSource === 'manual' ? 'manual' : 'example',
      rateDate: /^CDI: \d{2}\/\d{2}\/\d{4} · Selic: \d{2}\/\d{2}\/\d{4}$/.test(String(v.rateDate)) ? String(v.rateDate) : ''
    };
  };
  const businessDays = (count, unit) => {
    const n = limited(count, 1, unit === 'days' ? 2520 : 360, 1);
    return unit === 'days' ? n : n * WORK_DAYS_MONTH;
  };
  function dailyRate(annualPercent) {
    return Math.pow(1 + limited(annualPercent, 0, 100, 0) / 100, 1 / WORK_DAYS_YEAR) - 1;
  }
  function project(principal, annualRatePercent, days) {
    const p = limited(principal, 0, 1e12, 0);
    const duration = limited(days, 0, 7560, 0);
    const projected = p * Math.pow(1 + dailyRate(annualRatePercent), duration);
    return {principal:p, grossYield:projected - p, grossTotal:projected};
  }
  function compare(input, principalOverride) {
    const p = normalize(input);
    const principal = principalOverride === undefined ? p.principal : limited(principalOverride,0,1e12,0);
    const days = businessDays(p.periodCount,p.periodUnit);
    // Aplicação que paga x% do CDI; percentual aplicado à taxa diária do CDI.
    const cdiDaily = dailyRate(p.cdiAnnual) * p.cdiPercent / 100;
    const cdiTotal = principal * Math.pow(1 + cdiDaily, days);
    return {
      days, principal,
      cdi:{principal, grossTotal:cdiTotal, grossYield:cdiTotal-principal},
      treasury:project(principal,p.selicAnnual,days),
      quick:{
        cdiDay:principal*cdiDaily,
        cdiMonth:principal*(Math.pow(1+cdiDaily,WORK_DAYS_MONTH)-1),
        treasuryDay:project(principal,p.selicAnnual,1).grossYield,
        treasuryMonth:project(principal,p.selicAnnual,WORK_DAYS_MONTH).grossYield
      }
    };
  }
  async function fetchRates(fetcher = global.fetch && global.fetch.bind(global)) {
    if (typeof fetcher !== 'function') throw new Error('Consulta indisponível neste navegador. Informe as taxas manualmente.');
    // SGS 12: CDI % ao DIA. SGS 11: Selic efetiva % ao DIA.
    const ids = [12, 11];
    const [cdiData, selicData] = await Promise.all(ids.map(async id => {
      const response = await fetcher(`${BCB_URL}${id}/dados/ultimos/1?formato=json`, {headers:{Accept:'application/json'}, signal:global.AbortSignal && global.AbortSignal.timeout ? global.AbortSignal.timeout(10000) : undefined});
      if (!response.ok) throw new Error(`Banco Central indisponível (HTTP ${response.status}).`);
      const values = await response.json();
      const row = Array.isArray(values) ? values.at(-1) : null;
      const dayPercent = Number(row?.valor);
      if (!row || !/^\d{2}\/\d{2}\/\d{4}$/.test(String(row.data)) || !Number.isFinite(dayPercent) || dayPercent < 0 || dayPercent > 2) throw new Error('O Banco Central não retornou uma cotação válida.');
      return {date:row.data, annual:(Math.pow(1+dayPercent/100,WORK_DAYS_YEAR)-1)*100};
    }));
    return {cdiAnnual:cdiData.annual,selicAnnual:selicData.annual,rateDate:`CDI: ${cdiData.date} · Selic: ${selicData.date}`};
  }
  // rateDate do BCB inclui duas datas, salvas e apresentadas ao usuário.
  global.KaykoRendimentos = Object.freeze({DEFAULTS, normalize, businessDays, dailyRate, project, compare, fetchRates});
})(window);
