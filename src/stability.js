/**
 * Stability Manager for NebulaVM
 * 
 * Monitors and manages system stability, error recovery, and performance metrics.
 * Handles crash detection, state snapshots, and graceful degradation.
 * 
 * @module src/stability
 */

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

  /**
   * Record a cycle execution
   * @param {number} cycleTimeMs - Time taken for the cycle in milliseconds
   */
  recordCycle(cycleTimeMs) {
    this.metrics.cycleCount++;
    this.metrics.lastCycleTime = cycleTimeMs;

    // Update average cycle time (exponential moving average)
    const alpha = 0.1;
    this.metrics.averageCycleTime =
      alpha * cycleTimeMs +
      (1 - alpha) * this.metrics.averageCycleTime;

    // Check for performance degradation
    if (cycleTimeMs > this.thresholds.maxCycleTimeMs) {
      this.recordPerformanceWarning(
        `Cycle time exceeded threshold: ${cycleTimeMs}ms > ${this.thresholds.maxCycleTimeMs}ms`
      );
    }
  }

  /**
   * Record an error
   * @param {Error|string} error - The error object or message
   * @param {string} context - Additional context about the error
   */
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
    this.metrics.errorCount++;

    // Keep error log size bounded
    if (this.state.errorLog.length > 1000) {
      this.state.errorLog.shift();
    }

    // Check stability
    this.checkStability();
  }

  /**
   * Record a crash
   * @param {Error|string} crash - The crash error
   * @param {string} context - Additional context
   */
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
    this.metrics.crashCount++;
    this.lastCrashTimestamp = crashEntry.timestamp;

    // Keep crash log size bounded
    if (this.state.crashLog.length > 100) {
      this.state.crashLog.shift();
    }

    // Check stability
    this.checkStability();
  }

  /**
   * Record a performance warning
   * @param {string} message - Warning message
   */
  recordPerformanceWarning(message) {
    this.recordError(new Error(message), 'performance_warning');
  }

  /**
   * Check system stability and update state
   */
  checkStability() {
    const recentErrors = this.errorBuffer.filter(
      e => Date.now() - e.timestamp < 1000
    );

    // Too many errors in short time
    if (recentErrors.length >= this.thresholds.maxConsecutiveErrors) {
      this.state.isStable = false;
      return;
    }

    // Too many crashes
    const recentCrashes = this.crashBuffer.filter(
      e => Date.now() - e.timestamp < 60000
    );

    if (recentCrashes.length >= this.thresholds.maxCrashesPerMinute) {
      this.state.isStable = false;
      return;
    }

    this.state.isStable = true;
  }

  /**
   * Create a snapshot of the current VM state
   * @param {object} vmState - The VM state object to snapshot
   */
  createSnapshot(vmState) {
    this.state.lastStableSnapshot = {
      timestamp: Date.now(),
      vmState: JSON.parse(JSON.stringify(vmState)), // Deep copy
      metrics: { ...this.metrics },
    };
  }

  /**
   * Restore from last stable snapshot
   * @returns {object|null} The last stable snapshot or null
   */
  restoreSnapshot() {
    if (!this.state.lastStableSnapshot) {
      return null;
    }

    return {
      vmState: JSON.parse(
        JSON.stringify(this.state.lastStableSnapshot.vmState)
      ),
      timestamp: this.state.lastStableSnapshot.timestamp,
    };
  }

  /**
   * Get stability status
   * @returns {object} Stability information
   */
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

  /**
   * Get detailed metrics
   * @returns {object} All metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      stability: this.state.isStable ? 'stable' : 'unstable',
      errorLogSize: this.state.errorLog.length,
      crashLogSize: this.state.crashLog.length,
    };
  }

  /**
   * Get error history
   * @param {number} limit - Maximum number of errors to return
   * @returns {array} Error log entries
   */
  getErrorHistory(limit = 50) {
    return this.state.errorLog.slice(-limit);
  }

  /**
   * Get crash history
   * @param {number} limit - Maximum number of crashes to return
   * @returns {array} Crash log entries
   */
  getCrashHistory(limit = 20) {
    return this.state.crashLog.slice(-limit);
  }

  /**
   * Reset stability manager
   */
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

  /**
   * Set custom thresholds
   * @param {object} newThresholds - Threshold overrides
   */
  setThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  /**
   * Generate a stability report
   * @returns {object} Comprehensive stability report
   */
  generateReport() {
    const uptime = this.metrics.cycleCount > 0
      ? (Date.now() - (this.lastCrashTimestamp || Date.now())) / 1000
      : 0;

    return {
      timestamp: Date.now(),
      status: this.state.isStable ? 'STABLE' : 'UNSTABLE',
      metrics: this.getMetrics(),
      uptime: uptime.toFixed(2),
      recentErrors: this.getErrorHistory(10),
      recentCrashes: this.getCrashHistory(5),
      snapshot: this.state.lastStableSnapshot
        ? {
            timestamp: this.state.lastStableSnapshot.timestamp,
            age: Date.now() - this.state.lastStableSnapshot.timestamp,
          }
        : null,
    };
  }
}

// Export singleton instance for convenience
export const globalStabilityManager = new StabilityManager();
