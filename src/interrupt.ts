/**
 * Interrupt Handler System for NebulaVM
 * Handles hardware triggers without polling
 */

export interface InterruptHandler {
    id: number;
    priority: number;
    callback: (vm: any) => void;
    enabled: boolean;
}

export class InterruptController {
    private handlers: Map<number, InterruptHandler> = new Map();
    private interruptQueue: number[] = [];
    private interruptEnabled: boolean = true;
    private currentInterrupt: number | null = null;
    private nextHandlerId: number = 0;

    /**
     * Register an interrupt handler
     * @param priority Higher numbers = higher priority (0-255)
     * @param callback Function to execute when interrupt fires
     * @returns Handler ID for later reference
     */
    public registerHandler(
        priority: number,
        callback: (vm: any) => void
    ): number {
        const id = this.nextHandlerId++;
        const handler: InterruptHandler = {
            id,
            priority: Math.min(255, Math.max(0, priority)),
            callback,
            enabled: true,
        };
        this.handlers.set(id, handler);
        return id;
    }

    /**
     * Unregister an interrupt handler
     */
    public unregisterHandler(handlerId: number): boolean {
        return this.handlers.delete(handlerId);
    }

    /**
     * Enable/disable a specific handler
     */
    public setHandlerEnabled(handlerId: number, enabled: boolean): void {
        const handler = this.handlers.get(handlerId);
        if (handler) {
            handler.enabled = enabled;
        }
    }

    /**
     * Enable/disable all interrupts globally
     */
    public setInterruptsEnabled(enabled: boolean): void {
        this.interruptEnabled = enabled;
    }

    /**
     * Trigger an interrupt
     * @param interruptId Identifier for the interrupt source
     */
    public raiseInterrupt(interruptId: number): void {
        if (!this.interruptEnabled) return;
        this.interruptQueue.push(interruptId);
    }

    /**
     * Process pending interrupts (call from VM step cycle)
     */
    public processPendingInterrupts(vm: any): void {
        if (!this.interruptEnabled || this.interruptQueue.length === 0) {
            return;
        }

        // Sort by priority (higher priority first)
        const sortedHandlers = Array.from(this.handlers.values())
            .filter(h => h.enabled)
            .sort((a, b) => b.priority - a.priority);

        // Execute all pending interrupt handlers
        while (this.interruptQueue.length > 0) {
            const interruptId = this.interruptQueue.shift();
            
            // Find matching handler
            const handler = sortedHandlers.find(h => h.id === interruptId);
            if (handler) {
                this.currentInterrupt = handler.id;
                handler.callback(vm);
                this.currentInterrupt = null;
            }
        }
    }

    /**
     * Get current interrupt being processed
     */
    public getCurrentInterrupt(): number | null {
        return this.currentInterrupt;
    }

    /**
     * Get all registered handlers
     */
    public getHandlers(): InterruptHandler[] {
        return Array.from(this.handlers.values());
    }

    /**
     * Clear all pending interrupts
     */
    public clearQueue(): void {
        this.interruptQueue = [];
    }

    /**
     * Reset controller to initial state
     */
    public reset(): void {
        this.handlers.clear();
        this.interruptQueue = [];
        this.currentInterrupt = null;
        this.interruptEnabled = true;
        this.nextHandlerId = 0;
    }
}

/**
 * Predefined interrupt types
 */
export enum InterruptType {
    TIMER = 0x01,          // Timer/clock interrupt
    KEYBOARD = 0x02,       // Keyboard input
    MOUSE = 0x03,          // Mouse input
    VIDEO_VBLANK = 0x04,   // Vertical blanking interval
    MEMORY_ACCESS = 0x05,  // Memory access violation
    MATH_ERROR = 0x06,     // Division by zero, overflow
    USER_SIGNAL = 0x07,    // User-defined signal
    IO_COMPLETE = 0x08,    // I/O operation complete
}
