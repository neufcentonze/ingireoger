export function computeUniversalGain(baseProbability, streak = 1, houseEdge = 0.10) {
  if (baseProbability <= 0 || baseProbability >= 1 || streak < 1) return 0;

  const totalProbability = Math.pow(baseProbability, streak);
  const payout = (1 / totalProbability) * (1 - houseEdge);

  return parseFloat(payout.toFixed(2));
}

export function computeMinesStreakGain(safeCount, totalCells, streak, houseEdge = 0.10) {
  let probability = 1;

  for (let i = 0; i < streak; i++) {
    const safe = safeCount - i;
    const total = totalCells - i;
    if (safe <= 0 || total <= 0) return 0;
    probability *= safe / total;
  }

  const gain = (1 / probability) * (1 - houseEdge);
  return parseFloat(gain.toFixed(2));
}
