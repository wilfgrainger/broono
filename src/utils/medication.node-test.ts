import { getDaysUntilNextDose } from './medication.ts';
import { test } from 'node:test';
import assert from 'node:assert';

test('getDaysUntilNextDose', async (t) => {
  t.mock.timers.enable({ apis: ['Date'] });

  const scenarios = [
    { now: '2025-03-10T12:00:00Z', injectionDay: 1, expected: 7, desc: 'Monday to Monday' },
    { now: '2025-03-10T12:00:00Z', injectionDay: 2, expected: 1, desc: 'Monday to Tuesday' },
    { now: '2025-03-10T12:00:00Z', injectionDay: 0, expected: 6, desc: 'Monday to Sunday' },
    { now: '2025-03-09T12:00:00Z', injectionDay: 1, expected: 1, desc: 'Sunday to Monday' },
    { now: '2025-03-09T12:00:00Z', injectionDay: 0, expected: 7, desc: 'Sunday to Sunday' },
    { now: '2025-03-08T12:00:00Z', injectionDay: 1, expected: 2, desc: 'Saturday to Monday' },
  ];

  for (const scenario of scenarios) {
    await t.test(scenario.desc, () => {
      t.mock.timers.setTime(new Date(scenario.now).getTime());
      const result = getDaysUntilNextDose(scenario.injectionDay);
      assert.strictEqual(result, scenario.expected, `Failed ${scenario.desc}: expected ${scenario.expected}, got ${result}`);
    });
  }
});
