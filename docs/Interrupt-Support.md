# Interrupt Support

## Overview

NebulaVM now includes a **priority-based interrupt controller** that allows your programs to respond to hardware triggers without continuous polling. Interrupts are hardware signals that pause normal execution to handle time-critical events like keyboard input, timers, or I/O completion.

## Architecture

### Interrupt Controller

The `InterruptController` manages:
- **Handler Registration** - Register custom interrupt handlers with priority levels
- **Interrupt Queue** - Manages pending interrupts in FIFO order
- **Priority Sorting** - Higher priority handlers execute first
- **Global Enable/Disable** - Control all interrupts at once

### Interrupt Types

Predefined interrupt types via the `InterruptType` enum:

| Type | Value | Description |
|------|-------|-------------|
| `TIMER` | 0x01 | Timer/clock interrupt |
| `KEYBOARD` | 0x02 | Keyboard input |
| `MOUSE` | 0x03 | Mouse input |
| `VIDEO_VBLANK` | 0x04 | Vertical blanking interval |
| `MEMORY_ACCESS` | 0x05 | Memory access violation |
| `MATH_ERROR` | 0x06 | Division by zero, overflow |
| `USER_SIGNAL` | 0x07 | User-defined signal |
| `IO_COMPLETE` | 0x08 | I/O operation complete |

## Usage

### 1. Register an Interrupt Handler

```typescript
import { NebulaVM } from './nebulavm.js';
import { InterruptType } from './src/interrupt.js';

const vm = new NebulaVM();
const interruptCtrl = vm.getInterruptController();

// Register a handler with priority (0-255)
const handlerId = interruptCtrl.registerHandler(
    100,  // priority (higher = executed first)
    (vm) => {
        console.log('Interrupt handled!');
        // Your interrupt logic here
        vm.regs.a = 42; // Modify registers if needed
    }
);
```

### 2. Trigger an Interrupt

From JavaScript:
```typescript
// Trigger from your application
vm.raiseInterrupt(InterruptType.TIMER);

// Or via global (when exposed)
globalThis.raiseInterrupt(InterruptType.KEYBOARD);
```

From NVM Assembly:
```asm
; Enable interrupts
SEI

; Your program here
LDA 100
STA 255

; Disable interrupts
CLI
```

### 3. Interrupt Control Opcodes

| Opcode | Mnemonic | Value | Description |
|--------|----------|-------|-------------|
| SEI | Set interrupt Enable | 0x08 | Enable all interrupts |
| CLI | Clear interrupt (disable) | 0x09 | Disable all interrupts |

## Example: Timer Interrupt

```typescript
const vm = new NebulaVM();
const interruptCtrl = vm.getInterruptController();

// Register a timer handler
interruptCtrl.registerHandler(100, (vm) => {
    // Flash LED on every timer tick
    vm.mem[0xFF] = vm.mem[0xFF] === 0 ? 255 : 0;
});

// Simulate timer ticks
setInterval(() => {
    vm.raiseInterrupt(InterruptType.TIMER);
}, 16); // ~60 FPS

// Run VM
function loop() {
    vm.step(); // Interrupts processed automatically
    requestAnimationFrame(loop);
}
loop();
```

## Example: Keyboard + Mouse Handlers

```typescript
const vm = new NebulaVM();
const interruptCtrl = vm.getInterruptController();

// Keyboard handler (high priority)
interruptCtrl.registerHandler(200, (vm) => {
    console.log('Key pressed!');
    vm.raiseInterrupt(InterruptType.KEYBOARD);
});

// Mouse handler (lower priority)
interruptCtrl.registerHandler(100, (vm) => {
    console.log('Mouse moved!');
    const mouseX = vm.mem[0xFA];
    const mouseY = vm.mem[0xFB];
});

// Trigger from events
document.addEventListener('keydown', () => {
    vm.raiseInterrupt(InterruptType.KEYBOARD);
});

document.addEventListener('mousemove', (e) => {
    vm.mem[0xFA] = e.clientX & 0xFF;
    vm.mem[0xFB] = e.clientY & 0xFF;
    vm.raiseInterrupt(InterruptType.MOUSE);
});
```

## API Reference

### `InterruptController` Methods

#### `registerHandler(priority, callback): number`
Register a new interrupt handler.
- **priority** (0-255): Higher values = higher priority
- **callback**: Function that receives the VM instance
- **Returns**: Handler ID for later management

#### `unregisterHandler(handlerId): boolean`
Remove a registered handler.

#### `setHandlerEnabled(handlerId, enabled): void`
Enable or disable a specific handler.

#### `setInterruptsEnabled(enabled): void`
Globally enable/disable all interrupts.

#### `raiseInterrupt(interruptId): void`
Trigger an interrupt.

#### `processPendingInterrupts(vm): void`
**Called automatically** during `vm.step()`. Executes all pending handlers in priority order.

#### `getCurrentInterrupt(): number | null`
Get the ID of the interrupt currently being processed.

#### `getHandlers(): InterruptHandler[]`
List all registered handlers.

#### `clearQueue(): void`
Clear all pending interrupts.

#### `reset(): void`
Reset the controller to initial state.

### `NebulaVM` Interrupt Methods

#### `getInterruptController(): InterruptController`
Get the VM's interrupt controller instance.

#### `raiseInterrupt(interruptId): void`
Trigger an interrupt on this VM.

## Implementation Details

### Execution Flow

1. **VM Step Cycle** - Each `vm.step()` call:
   - Processes pending interrupts first
   - Executes the next instruction
   - Returns control to caller

2. **Handler Execution** - Handlers are:
   - Sorted by priority (highest first)
   - Executed synchronously
   - Can modify VM state (registers, memory)
   - Can raise additional interrupts

3. **Interrupt Queue** - Interrupts are:
   - Queued in FIFO order
   - Processed immediately on next `vm.step()`
   - Skipped if `interruptsEnabled = false`

### Priority System

Handlers with higher priority values execute first:
```
Priority 255: ████████████████ (Highest - executes first)
Priority 200: ████████████
Priority 100: ████████
Priority 0:   ████ (Lowest - executes last)
```

## Best Practices

1. **Keep handlers fast** - Interrupt handlers should complete quickly to avoid blocking the main loop.

2. **Use appropriate priorities** - Critical handlers (like keyboard input) should have higher priority.

3. **Enable/disable wisely** - Use `SEI`/`CLI` opcodes to control interrupts during critical sections.

4. **Avoid recursive interrupts** - A handler shouldn't raise the same interrupt type indefinitely.

5. **Test thoroughly** - Interrupts can introduce subtle timing bugs. Test edge cases.

## Planned Enhancements

- [ ] Interrupt vectors (jump table for handlers)
- [ ] Maskable vs non-maskable interrupts
- [ ] Interrupt nesting levels
- [ ] Hardware-specific interrupt simulation (real timing)

