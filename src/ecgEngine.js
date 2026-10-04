export class ECGEngine {
  constructor() {
    this.t = 0;
    this.isAnomalyActive = false;
  }

  generateSample() {
    this.t += 0.04;
    const period = this.t % (2 * Math.PI);

    let pWave = 0.15 * Math.exp(-Math.pow(period - 1.0, 2) / 0.02);
    let qrsWave = 1.2 * Math.exp(-Math.pow(period - 2.0, 2) / 0.005) - 0.2 * Math.exp(-Math.pow(period - 1.9, 2) / 0.005);
    let tWave = 0.3 * Math.exp(-Math.pow(period - 3.2, 2) / 0.08);

    let baselineSignal = pWave + qrsWave + tWave;
    const noise = (Math.random() - 0.5) * 0.03;
    let observedSignal = baselineSignal + noise;

    if (this.isAnomalyActive && period > 2.1 && period < 3.0) {
      observedSignal += 0.45;
    }

    let reconstructedBaseline = baselineSignal;
    const reconstructionError = Math.abs(observedSignal - reconstructedBaseline);

    return {
      time: this.t.toFixed(2),
      observed: parseFloat(observedSignal.toFixed(3)),
      reconstructed: parseFloat(reconstructedBaseline.toFixed(3)),
      error: parseFloat(reconstructionError.toFixed(3))
    };
  }

  triggerAnomaly(durationMs = 4000) {
    this.isAnomalyActive = true;
    setTimeout(() => {
      this.isAnomalyActive = false;
    }, durationMs);
  }
}
