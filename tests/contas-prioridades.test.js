/* Para executar: node tests/contas-prioridades.test.js */
'use strict';
const assert = require('node:assert/strict');
const priority = require('../assets/js/contas-prioridades.js');

const today = new Date(2026, 10, 9, 15); // 09/11/2026, 15h (hora local)
const p = (day) => priority.getPriority({ day, active: true }, today);

assert.deepEqual([p(9).tone, p(10).tone, p(11).tone, p(15).tone, p(16).tone],
  ['red', 'red', 'yellow', 'yellow', 'green']);
assert.equal(p(9).label, 'Vence hoje');
assert.equal(p(10).label, 'Vence amanhã');
assert.equal(p(11).days, 2);
assert.equal(p(16).days, 7);
assert.equal(p(8).dueISO, '2026-12-08'); // vencimento anterior já passou
assert.equal(p(31).dueISO, '2026-11-30'); // novembro não tem dia 31
assert.equal(priority.getPriority({ day: 31 }, new Date(2027, 1, 1)).dueISO, '2027-02-28');
assert.equal(priority.getPriority({ day: 31 }, new Date(2028, 1, 1)).dueISO, '2028-02-29');
assert.equal(priority.getPriority({ day: 1 }, new Date(2026, 11, 31)).dueISO, '2027-01-01');
assert.equal(priority.getPriority({ day: 10, active: false }, today).tone, 'paused');
const bills = [
  { name: 'Mais distante', day: 20, active: true },
  { name: 'Pausada', day: 9, active: false },
  { name: 'Urgente', day: 9, active: true },
  { name: 'Próxima', day: 11, active: true },
];
const before = bills.map(b => b.name);
assert.deepEqual(priority.sortBills(bills, today).map(b => b.name),
  ['Urgente', 'Próxima', 'Mais distante', 'Pausada']);
assert.deepEqual(bills.map(b => b.name), before); // não altera os registros originais
console.log('OK: datas, cores, meses curtos, virada de ano, pausa e ordenação.');
