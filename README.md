# 🌌 NebulaVM Dev SDK
**Version 1.0.0-beta**  
**License:** GNU General Public License v3 (GPL-3.0)

---

## 📜 Overview
NebulaVM is a high-performance, strictly non-WASM virtual machine and development ecosystem designed for low-level architectural simulation. It provides a bridge between pure mathematical 8-bit processing and modern web-based graphical outputs. 

Unlike traditional emulators, NebulaVM is designed as a **Developer SDK**. It abstracts the complexity of 8-bit hardware into a modular TypeScript/JavaScript environment, allowing developers to build, flash, and debug programs that interact with virtualized hardware via Memory-Mapped I/O (MMIO).

### Core Philosophy
- **Authentic Constraints:** Operates on a strict 8-bit logic (0-255) with register-based math.
- **Environment Agnostic:** The core engine is a standalone service that can be run in a Node.js console or a Browser UI.
- **Pure JavaScript:** No WebAssembly or external binaries. The entire execution pipeline is readable, hackable, and extendable.

---

## 🏗 Modular Architecture

The SDK is organized into a distributed file structure to separate the concerns of the CPU, the Compiler, and the I/O layers.

### Root Directory
*   `nebulavm.js`: The Virtual CPU. Handles the fetch-decode-execute cycle, register management, and the 256-byte RAM bank.
*   `nebulalaassembler.js`: The compiler. A Domain-Specific Language (DSL) parser that translates human-readable NVM Assembly into executable machine code.
*   `main.ts / main.js`: The application orchestrator. This is where you initialize the hardware, flash the binary, and start the clock cycles.
*   `package.json`: Manages the SDK environment and the TypeScript build pipeline.

### `/src/` (The Engine Core)
*   `uiengine.ts`: The visual synthesizer. It monitors specific memory addresses (VRAM) and translates them into pixels on an HTML5 Canvas.
*   `render.ts`: High-performance drawing routines optimized for 8-bit coordinate systems.
*   `math.ts`: The arithmetic unit. Handles 8-bit bitwise operations, overflow wrapping, and hex conversions.

### `/filemgr/` (Storage & Persistence)
*   `fileengine.ts`: A virtualized disk controller. It handles the serialization of bytecode and allows for persistent program storage using `localStorage` or local file blobs.
*   `filemgr.js`: The manager interface for loading and switching between different `.nvm` projects.

---

## 📟 Hardware Specifications


| Component | Specification | Description |
| :--- | :--- | :--- |
| **CPU Architecture** | 8-bit RISC-sim | Custom instruction set with 1-byte opcodes. |
| **Registers** | A, B, PC, ZF | Accumulator, General Register, Program Counter, Zero Flag. |
| **Memory (RAM)** | 256 Bytes | Shared space for instructions, data, and I/O. |
| **Clock Speed** | Variable | Driven by `requestAnimationFrame` or `setInterval` for console use. |
| **Video Out** | MMIO (0xFF) | Maps memory address 255 to a 256px horizontal buffer. |
| **Input** | MMIO (0xFA-FB) | Real-time injection of Mouse X and Mouse Y into the RAM bank. |

---

## 🚀 Development Workflow

### 1. Installation & Setup
Ensure you have Node.js installed. Initialize the SDK environment:
```bash
npm install
npm run dev # Starts the TypeScript compiler in watch mode
```

### 2. Writing NVM Assembly
Programs are written using a mnemonic-based syntax. 
```asm
; --- NEBULA MOUSE TRACKER ---
; Goal: Glow an LED when the mouse passes the center of the screen.

START:
  LDA [250]   ; Load Mouse X (MMIO)
  LDB 128     ; Load half-screen constant
  SUB         ; Custom math logic
  STA 255     ; Output to LED/Video port
  JMP START   ; Loop indefinitely
```

### 3. Compilation & Flashing
The `NebulaAssembler` converts the text above into a `Uint8Array`. This array is then "flashed" into the VM memory starting at address `0x00`.

---

## ⚖️ GNU General Public License v3

**Copyleft (C-left) 2026 homemovie**

NebulaVM is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the [GNU General Public License](https://gnu.org) for more details.

---

## 🛠 Planned Roadmap
- [ ] **Interrupt Support:** Handling hardware triggers without polling.
- [ ] **Stack Pointer:** Adding `PUSH` and `POP` for subroutine support.
- [ ] **Debugger UI:** A real-time visualizer for the memory grid and register state.
- [ ] **Node-Bridge:** A CLI tool to run NVM binaries directly from the terminal.
