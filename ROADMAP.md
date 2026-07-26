# 🌌 NebulaVM Development Roadmap

## Version 2.0 - Alpha Release

### ✅ Completed
- [x] Core VM architecture (8-bit RISC-sim with 256 bytes RAM)
- [x] Basic instruction set (HLT, LDA, LDB, ADD, SUB, etc.)
- [x] Register system (A, B, PC, ZF, CF, OF)
- [x] Memory management and banking
- [x] Interrupt controller system
- [x] GitHub Actions CI setup
- [x] Stability manager for crash detection and recovery
- [x] Comprehensive unit tests for core opcodes

### 🚀 Current Phase: Stabilization & Testing

#### Short-term (This Sprint)
- [ ] Run CI and confirm green build + tests on `main`
- [ ] Migrate core: move `nebulavm.js` → `src/nebulavm.ts` and ensure `tsc` passes
- [ ] Fix assembler filename/imports and add basic assembler tests
- [ ] Add integration tests combining multiple opcodes
- [ ] Create developer documentation (Getting Started guide)
- [ ] Performance benchmarking suite

#### Medium-term (Next Sprint)
- [ ] Extended instruction set support
  - [ ] Bitwise operations (AND, OR, XOR, NOT verified)
  - [ ] Shift operations (SHL, SHR verified)
  - [ ] Increment/Decrement (INC, DEC verified)
- [ ] Memory operations tests
  - [ ] STA (Store Accumulator)
  - [ ] LDM (Load from Memory)
  - [ ] STM (Store to Memory)
- [ ] Advanced interrupt handling
  - [ ] Timer interrupts
  - [ ] I/O interrupts
  - [ ] Nested interrupt support
- [ ] UI Engine enhancements
  - [ ] Real-time VRAM visualization
  - [ ] Canvas rendering optimization
  - [ ] Input handling (mouse, keyboard)

### 🎯 Beta Phase (v2.0 Beta)
- [ ] Full TypeScript migration
- [ ] Async execution model
- [ ] WebWorker support for background execution
- [ ] Advanced debugging interface
  - [ ] Breakpoint system
  - [ ] Watch expressions
  - [ ] Step-by-step execution with state inspection
- [ ] Plugin system for custom instructions
- [ ] Assembly language toolchain
  - [ ] Full NVM Assembly compiler
  - [ ] Linker support
  - [ ] Disassembler

### 📦 Release Phase (v3.0+)
- [ ] Stable 3.0 release
- [ ] Extended VM capabilities
  - [ ] Multi-threaded execution support
  - [ ] Advanced memory management
  - [ ] External module loading
- [ ] Comprehensive IDE integration
  - [ ] VS Code extension
  - [ ] Syntax highlighting
  - [ ] Live debugging
- [ ] Performance optimizations
  - [ ] JIT compilation
  - [ ] Instruction caching
- [ ] Community library ecosystem

## Architecture Roadmap

### Core Engine Evolution
```
v2.0 Alpha          v2.0 Beta           v3.0 Stable
├─ 8-bit RISC      ├─ TypeScript       ├─ Multi-core
├─ Basic Opcodes   ├─ Advanced Debug   ├─ JIT Compiler
├─ 256 Byte RAM    ├─ Plugin System    ├─ Module System
├─ Simple UI       └─ Full Toolchain   └─ IDE Integration
```

### Instruction Set Roadmap

#### Phase 1 - Current (Core Instructions)
- `0x00` - HLT (Halt) ✅
- `0x01` - LDA (Load Accumulator) ✅
- `0x02` - LDB (Load B Register) ✅
- `0x03` - ADD (Add) ✅
- `0x04` - SUB (Subtract) ✅
- `0x05` - CMP (Compare) ✅
- `0x06` - JZ (Jump if Zero) ✅
- `0x07` - JMP (Unconditional Jump) ✅
- `0x0A` - MUL (Multiply) ✅
- `0x0B` - DIV (Divide) ✅

#### Phase 2 - Bitwise & Logical
- `0x0C` - AND (Bitwise AND) ✅
- `0x0D` - OR (Bitwise OR) ✅
- `0x0E` - XOR (Bitwise XOR) ✅
- `0x0F` - NOT (Bitwise NOT) ✅
- `0x10` - SHL (Shift Left) ✅
- `0x11` - SHR (Shift Right) ✅

#### Phase 3 - Memory Operations
- `0x12` - STA (Store Accumulator) ✅
- `0x13` - LDM (Load from Memory) ✅
- `0x14` - STM (Store to Memory) ✅

#### Phase 4 - Register Operations
- `0x15` - INC (Increment) ✅
- `0x16` - DEC (Decrement) ✅
- `0x17` - SWAP (Swap A & B) ✅

#### Phase 5 - System Instructions
- `0x08` - SEI (Set Interrupts Enabled) ✅
- `0x09` - CLI (Clear Interrupts) ✅
- `0x18` - NOP (No Operation) ✅

#### Phase 6 - Advanced (Future)
- Conditional jumps (JZ, JNZ, JC, etc.)
- Stack operations (PUSH, POP)
- Call/Return mechanism (CALL, RET)
- Advanced addressing modes
- SIMD operations

## Testing Strategy

### Unit Testing
- ✅ Core opcode tests (30+ test cases)
- [ ] Assembler tests
- [ ] Integration tests
- [ ] Performance regression tests

### Integration Testing
- [ ] Multi-instruction sequences
- [ ] Memory access patterns
- [ ] Interrupt handling flows
- [ ] UI rendering pipeline

### Stress Testing
- [ ] Long-running programs
- [ ] Memory pressure scenarios
- [ ] Rapid interrupt handling
- [ ] Extreme input conditions

## Documentation Roadmap

### Essential
- [x] README with overview
- [x] Hardware specifications
- [x] Development workflow
- [ ] **ROADMAP** (this file)
- [ ] Getting started guide
- [ ] API documentation

### Advanced
- [ ] Architecture deep-dive
- [ ] Memory model documentation
- [ ] Interrupt system guide
- [ ] Optimization techniques
- [ ] Troubleshooting guide

### Community
- [ ] Contributing guidelines
- [ ] Code style guide
- [ ] Release process
- [ ] Community showcase

## Performance Goals

### Target Metrics (v2.0)
- **Cycle Speed:** 100,000+ cycles per second (Node.js)
- **Memory Footprint:** < 50KB core VM + UI
- **Startup Time:** < 100ms
- **Instruction Throughput:** 60+ instructions/ms

### Target Metrics (v3.0)
- **Cycle Speed:** 1,000,000+ cycles per second (optimized)
- **Memory Footprint:** < 100KB with full features
- **Startup Time:** < 50ms
- **JIT Overhead:** < 5% for typical workloads

## Known Issues & Limitations

### Current (v2.0 Alpha)
- [ ] No memory protection (user code can modify interrupt handlers)
- [ ] Limited error recovery options
- [ ] JavaScript execution model (no true parallelism)
- [ ] UI rendering limited to Canvas API

### To Be Addressed
- [ ] Multi-core execution (requires architecture redesign)
- [ ] Advanced memory paging
- [ ] DMA operations
- [ ] Real-time guarantees

## Dependencies

### Required
- Node.js 16+
- TypeScript 5.0+

### Optional
- Browser with ES6+ support (for UI)
- Standard development tools (npm, git)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) (when available) for how to:
- Report bugs
- Suggest features
- Submit pull requests
- Join development discussions

## Milestones

| Version | Target Date | Status | Notes |
|---------|-------------|--------|-------|
| 2.0 Alpha | Q3 2026 | 🚀 In Progress | Core functionality complete |
| 2.0 Beta | Q4 2026 | ⏳ Planned | Full TypeScript migration |
| 2.0 Stable | Q1 2027 | ⏳ Planned | Production ready |
| 3.0 | Q2 2027 | ⏳ Planned | Extended features |

---

**Last Updated:** July 26, 2026  
**Maintained By:** homemovie  
**License:** GPL-3.0
