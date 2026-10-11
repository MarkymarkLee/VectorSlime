/**
 * Work to run once the tutor's current turn has finished speaking, e.g.
 * opening the next lesson after the tutor says "let's move on".
 */
const queue: (() => void)[] = [];

export function afterTurn(fn: () => void) {
  queue.push(fn);
}

export function flushAfterTurn() {
  const jobs = queue.splice(0);
  for (const job of jobs) job();
}
