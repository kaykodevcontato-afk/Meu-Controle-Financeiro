/* Execute: node tests/investimentos-trade.test.js
 * Testes puros para quantidades, custos, cenários e compatibilidade de backups. */
'use strict';
const assert=require('node:assert/strict');
const market=require('../assets/js/investimentos-trade.js');
// O módulo publica em globalThis no Node.js, sem executar interface DOM.
const m=globalThis.KaykoInvestimentos;
assert(m,'Módulo indisponível');
assert.equal(m.simular('PETR4',100,45.36,10).quantity,2);
assert.equal(m.simular('PETR4',20,45.36,10).quantity,0);
assert.equal(m.simular('AAPL',100,342.37,10).quantity>0,true);
const s=m.simular('PETR4',100,20,-50);
assert.equal(s.quantity,5);
assert.equal(s.gain,-50);
assert.equal(s.futureValue,50);
assert.equal(m.simular('BTC',10,50000,-100).futureValue,0);
assert.equal(m.simular('PETR4',100,20,-101),null);
assert.equal(m.simular('PETR4',100,0,10),null);
assert.equal(m.simular('PETR4',100,20,Infinity),null);
assert.equal(m.normalizeRecords(undefined).length,0);
assert.equal(m.normalizeRecords([{id:'1',symbol:'PETR4',quantity:3,buyPrice:20,currentPrice:22,date:'2026-11-09'}]).length,1);
assert.equal(m.normalizeRecords([{id:'x',symbol:'BAD',quantity:3,buyPrice:20}]).length,0);
assert.equal(m.normalizeSettings(null).usdBrl,0);
assert.equal(m.normalizeSettings({usdBrl:5.28}).usdBrl,5.28);
console.log('Investimentos: cálculos e compatibilidade OK');
