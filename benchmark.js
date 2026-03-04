const logs = Array.from({ length: 1000 }, () => ({ weight: Math.random() * 100 + 100 }));

console.time('original');
for (let i = 0; i < 10000; i++) {
    const weights = logs.map((l) => l.weight);
    const maxW = Math.max(...weights) + 3;
    const minW = Math.min(...weights) - 3;
}
console.timeEnd('original');

console.time('reduce-clean-7');
for (let i = 0; i < 10000; i++) {
    const minMax = logs.reduce(
        (acc, l) => {
            acc[0] = Math.min(acc[0], l.weight);
            acc[1] = Math.max(acc[1], l.weight);
            return acc;
        },
        [Infinity, -Infinity]
    );
    const maxW = minMax[1] + 3;
    const minW = minMax[0] - 3;
}
console.timeEnd('reduce-clean-7');

console.time('reduce-clean-8');
for (let i = 0; i < 10000; i++) {
    const { min, max } = logs.reduce(
        (acc, l) => {
            acc.min = Math.min(acc.min, l.weight);
            acc.max = Math.max(acc.max, l.weight);
            return acc;
        },
        { min: Infinity, max: -Infinity }
    );
    const maxW = max + 3;
    const minW = min - 3;
}
console.timeEnd('reduce-clean-8');
