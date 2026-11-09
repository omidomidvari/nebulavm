import { triggerCrashScreen } from '../crashscreen.js';

export class StabilityManager {
  constructor() {
    this.metrics = {
      cycleCount: 0,
      errorCount: 0,
      crashCount: 0,
      lastCycleTime: 0,
      averageCycleTime: 0,
    };

    this.state = {
      isStable: true,
      lastStableSnapshot: null,
      errorLog: [],
      crashLog: [],
    };

    this.thresholds = {
      maxConsecutiveErrors: 10,
      maxCrashesPerMinute: 5,
      maxCycleTimeMs: 100,
    };

    this.errorBuffer = [];
    this.crashBuffer = [];
    this.lastCrashTimestamp = 0;
  }

  recordCycle(cycleTimeMs) {
    this.metrics.cycleCount += 1;
    this.metrics.lastCycleTime = cycleTimeMs;

    const alpha = 0.1;
    this.metrics.averageCycleTime = alpha * cycleTimeMs + (1 - alpha) * this.metrics.averageCycleTime;

    if (cycleTimeMs > this.thresholds.maxCycleTimeMs) {
      this.recordPerformanceWarning(`Cycle time exceeded threshold: ${cycleTimeMs}ms > ${this.thresholds.maxCycleTimeMs}ms`);
    }
  }

  recordError(error, context = '') {
    const errorEntry = {
      timestamp: Date.now(),
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : '',
      context,
      cycleCount: this.metrics.cycleCount,
    };

    this.errorBuffer.push(errorEntry);
    this.state.errorLog.push(errorEntry);
    this.metrics.errorCount += 1;

    if (this.state.errorLog.length > 1000) this.state.errorLog.shift();
    this.checkStability();
  }

  recordCrash(crash, context = '') {
    const crashEntry = {
      timestamp: Date.now(),
      message: crash instanceof Error ? crash.message : String(crash),
      stack: crash instanceof Error ? crash.stack : '',
      context,
      cycleCount: this.metrics.cycleCount,
      metrics: { ...this.metrics },
    };

    this.crashBuffer.push(crashEntry);
    this.state.crashLog.push(crashEntry);
    this.metrics.crashCount += 1;
    this.lastCrashTimestamp = crashEntry.timestamp;

    if (this.state.crashLog.length > 100) this.state.crashLog.shift();

    triggerCrashScreen('NEBULA_SYSTEM_FAILURE', {
      source: 'StabilityManager',
      reason: crashEntry.message,
      stack: crashEntry.stack,
      context,
    });

    this.checkStability();
  }

  recordPerformanceWarning(message) {
    this.recordError(new Error(message), 'performance_warning');
  }

  checkStability() {
    const recentErrors = this.errorBuffer.filter((entry) => Date.now() - entry.timestamp < 1000);
    if (recentErrors.length >= this.thresholds.maxConsecutiveErrors) {
      this.state.isStable = false;
      return;
    }

    const recentCrashes = this.crashBuffer.filter((entry) => Date.now() - entry.timestamp < 60000);
    if (recentCrashes.length >= this.thresholds.maxCrashesPerMinute) {
      this.state.isStable = false;
      return;
    }

    this.state.isStable = true;
  }

  createSnapshot(vmState) {
    this.state.lastStableSnapshot = {
      timestamp: Date.now(),
      vmState: JSON.parse(JSON.stringify(vmState)),
      metrics: { ...this.metrics },
    };
  }

  restoreSnapshot() {
    if (!this.state.lastStableSnapshot) return null;

    return {
      vmState: JSON.parse(JSON.stringify(this.state.lastStableSnapshot.vmState)),
      timestamp: this.state.lastStableSnapshot.timestamp,
    };
  }

  getStatus() {
    return {
      isStable: this.state.isStable,
      metrics: { ...this.metrics },
      errorCount: this.state.errorLog.length,
      crashCount: this.state.crashLog.length,
      recentErrors: this.errorBuffer.slice(-5),
      recentCrashes: this.crashBuffer.slice(-5),
    };
  }

  getMetrics() {
    return {
      ...this.metrics,
      stability: this.state.isStable ? 'stable' : 'unstable',
      errorLogSize: this.state.errorLog.length,
      crashLogSize: this.state.crashLog.length,
    };
  }

  getErrorHistory(limit = 50) {
    return this.state.errorLog.slice(-limit);
  }

  getCrashHistory(limit = 20) {
    return this.state.crashLog.slice(-limit);
  }

  reset() {
    this.metrics = {
      cycleCount: 0,
      errorCount: 0,
      crashCount: 0,
      lastCycleTime: 0,
      averageCycleTime: 0,
    };

    this.state = {
      isStable: true,
      lastStableSnapshot: null,
      errorLog: [],
      crashLog: [],
    };

    this.errorBuffer = [];
    this.crashBuffer = [];
    this.lastCrashTimestamp = 0;
  }

  setThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  generateReport() {
    const uptime = this.metrics.cycleCount > 0 ? (Date.now() - (this.lastCrashTimestamp || Date.now())) / 1000 : 0;

    return {
      timestamp: Date.now(),
      status: this.state.isStable ? 'STABLE' : 'UNSTABLE',
      metrics: this.getMetrics(),
      uptime: uptime.toFixed(2),
      recentErrors: this.getErrorHistory(10),
      recentCrashes: this.getCrashHistory(5),
      snapshot: this.state.lastStableSnapshot ? {
        timestamp: this.state.lastStableSnapshot.timestamp,
        age: Date.now() - this.state.lastStableSnapshot.timestamp,
      } : null,
    };
  }
}

export const globalStabilityManager = new StabilityManager();
