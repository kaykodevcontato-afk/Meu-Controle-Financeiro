/* ================================================================
   PRIORIDADES DE PAGAMENTO — Meu Controle Financeiro | Dev Kayko
   Edite AQUI os intervalos de alerta (PRIORITY_DAYS).

   Verde:    7 dias ou mais antes do próximo vencimento.
   Amarelo:  2 a 6 dias antes do próximo vencimento.
   Vermelho: hoje ou amanhã (0 a 1 dia).
   Cinza:    conta pausada.

   Observação: são contas RECORRENTES sem registro de quitação.
   Mostramos a PRÓXIMA data, não afirmamos que a conta foi paga
   nem que uma parcela anterior esteja em atraso.
   ================================================================ */
(function (root) {
  'use strict';

  const PRIORITY_DAYS = Object.freeze({ redThrough: 1, yellowThrough: 6 });
  const DAY_MS = 24 * 60 * 60 * 1000;
  const two = (number) => String(number).padStart(2, '0');

  // Dia 29, 30 ou 31 em meses mais curtos vira o último dia daquele mês.
  function dateForMonth(year, monthIndex, preferredDay) {
    const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
    const day = Math.min(Math.max(Math.trunc(Number(preferredDay) || 1), 1), lastDay);
    return new Date(Date.UTC(year, monthIndex, day));
  }

  function nextDueDate(day, referenceDate = new Date()) {
    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth();
    const startToday = Date.UTC(year, month, referenceDate.getDate());
    let due = dateForMonth(year, month, day);
    if (due.getTime() < startToday) due = dateForMonth(year, month + 1, day);
    return due;
  }

  function getPriority(bill, referenceDate = new Date()) {
    if (bill.active === false) {
      return { tone: 'paused', label: 'Pausada', description: 'Conta sem alerta ativo', days: Infinity, dueText: '—', dueISO: '' };
    }

    const due = nextDueDate(bill.day, referenceDate);
    const startToday = Date.UTC(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
    const days = Math.round((due.getTime() - startToday) / DAY_MS);
    const tone = days <= PRIORITY_DAYS.redThrough ? 'red' : days <= PRIORITY_DAYS.yellowThrough ? 'yellow' : 'green';
    const dueText = `${two(due.getUTCDate())}/${two(due.getUTCMonth() + 1)}/${due.getUTCFullYear()}`;
    const label = days === 0 ? 'Vence hoje' : days === 1 ? 'Vence amanhã' : `Faltam ${days} dias`;

    return {
      tone, label, days, dueText,
      dueISO: `${due.getUTCFullYear()}-${two(due.getUTCMonth() + 1)}-${two(due.getUTCDate())}`,
      description: `${label} (${dueText})`
    };
  }

  // Contas mais urgentes primeiro; contas pausadas ficam no fim.
  function sortBills(bills, referenceDate = new Date()) {
    return [...bills].sort((left, right) => {
      const a = getPriority(left, referenceDate);
      const b = getPriority(right, referenceDate);
      return (a.days - b.days) || String(left.name).localeCompare(String(right.name), 'pt-BR');
    });
  }

  const api = Object.freeze({ PRIORITY_DAYS, nextDueDate, getPriority, sortBills });
  root.ControlePrioridadeContas = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
