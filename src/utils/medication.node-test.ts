import { getDaysUntilNextDose } from './medication.ts';
import { test } from 'node:test';
import assert from 'node:assert';

test('getDaysUntilNextDose', async (t) => {
  t.mock.timers.enable({ apis: ['Date'] });

  const scenarios = [
    { now: [2025, 2, 10], injectionDay: 1, expected: 7, desc: 'Monday to Monday' },
    { now: [2025, 2, 10], injectionDay: 2, expected: 1, desc: 'Monday to Tuesday' },
    { now: [2025, 2, 10], injectionDay: 0, expected: 6, desc: 'Monday to Sunday' },
    { now: [2025, 2, 9], injectionDay: 1, expected: 1, desc: 'Sunday to Monday' },
    { now: [2025, 2, 9], injectionDay: 0, expected: 7, desc: 'Sunday to Sunday' },
    { now: [2025, 2, 8], injectionDay: 1, expected: 2, desc: 'Saturday to Monday' },
  ];

  for (const scenario of scenarios) {
    await t.test(scenario.desc, () => {
      // Local noon, so the weekday does not depend on the machine's time zone.
      const [year, month, day] = scenario.now;
      t.mock.timers.setTime(new Date(year, month, day, 12).getTime());
      const result = getDaysUntilNextDose(scenario.injectionDay);
      assert.strictEqual(result, scenario.expected, `Failed ${scenario.desc}: expected ${scenario.expected}, got ${result}`);
    });
  }
});
