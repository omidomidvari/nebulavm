#!/bin/bash

# NebulaVM Complete Binary Setup Script for Termux
# This script creates a complete standalone binary + dev environment
# Installs everything needed to compile NVM ASM programs in Termux

set -e

echo "================================"
echo "🌌 NebulaVM Termux Binary Setup"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Paths
PREFIX=${PREFIX:-$HOME}
NEBULAVM_HOME="$PREFIX/nebulavm"
BIN_PATH="$PREFIX/bin"
NVM_BIN="$BIN_PATH/nvm"

echo -e "${BLUE}=== PHASE 1: System Setup ===${NC}"
echo -e "${GREEN}[1/10]${NC} Updating package manager..."
pkg update -y
pkg upgrade -y

echo -e "${GREEN}[2/10]${NC} Installing essential packages..."
pkg install -y git
pkg install -y nodejs
pkg install -y npm
pkg install -y python
pkg install -y build-essential
pkg install -y clang
pkg install -y make

echo ""
echo -e "${BLUE}=== PHASE 2: Repository Setup ===${NC}"
echo -e "${GREEN}[3/10]${NC} Cloning NebulaVM repository..."
if [ -d "$NEBULAVM_HOME" ]; then
    echo "Repository already exists. Pulling latest changes..."
    cd "$NEBULAVM_HOME"
    git pull origin main 2>/dev/null || git pull origin master
else
    cd "$PREFIX"
    git clone https://github.com/omidomidvari/nebulavm.git
    cd "$NEBULAVM_HOME"
fi

echo -e "${GREEN}[4/10]${NC} Installing npm dependencies..."
npm install --production

echo ""
echo -e "${BLUE}=== PHASE 3: Binary Creation ===${NC}"
echo -e "${GREEN}[5/10]${NC} Creating bin directory..."
mkdir -p "$BIN_PATH"

echo -e "${GREEN}[6/10]${NC} Building project..."
if [ -f "package.json" ]; then
    npm run build 2>/dev/null || npm run compile 2>/dev/null || echo "No build script found, using existing files"
fi

echo -e "${GREEN}[7/10]${NC} Creating NVM CLI binary..."
cat > "$NVM_BIN" << 'NVMBIN'
#!/bin/bash
# NebulaVM CLI Binary for Termux
# Usage: nvm [command] [file.nvm]

NEBULAVM_HOME="${NEBULAVM_HOME:-$HOME/nebulavm}"
NODE_ENV=production

# Ensure Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install with: pkg install nodejs"
    exit 1
fi

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

show_help() {
    echo "🌌 NebulaVM CLI v1.0"
    echo ""
    echo "Usage: nvm [command] [options]"
    echo ""
    echo "Commands:"
    echo "  run <file.nvm>          Execute a compiled .nvm binary"
    echo "  compile <file.asm>      Compile NVM Assembly to binary"
    echo "  dev                     Start development server"
    echo "  repl                    Launch interactive REPL"
    echo "  help                    Show this help message"
    echo ""
    echo "Examples:"
    echo "  nvm compile program.asm"
    echo "  nvm run program.nvm"
    echo "  nvm dev"
}

case "$1" in
    run)
        if [ -z "$2" ]; then
            echo -e "${RED}Error: No file specified${NC}"
            echo "Usage: nvm run <file.nvm>"
            exit 1
        fi
        echo -e "${GREEN}▶ Running $2...${NC}"
        node -e "
            const fs = require('fs');
            const path = require('path');
            const CPU = require('$NEBULAVM_HOME/nebulavm.js');
            
            const binary = fs.readFileSync('$2');
            const cpu = new CPU();
            cpu.flash(binary);
            cpu.run();
            console.log('✅ Program completed');
        "
        ;;
    compile)
        if [ -z "$2" ]; then
            echo -e "${RED}Error: No file specified${NC}"
            echo "Usage: nvm compile <file.asm>"
            exit 1
        fi
        echo -e "${GREEN}🔧 Compiling $2...${NC}"
        node -e "
            const fs = require('fs');
            const path = require('path');
            const Assembler = require('$NEBULAVM_HOME/nebulassembler.js');
            
            const source = fs.readFileSync('$2', 'utf8');
            const assembler = new Assembler();
            const binary = assembler.compile(source);
            const outfile = '${2%.asm}.nvm';
            fs.writeFileSync(outfile, binary);
            console.log(String.fromCharCode(27) + '[32m✅ Compiled to ' + outfile + String.fromCharCode(27) + '[0m');
        "
        ;;
    dev)
        echo -e "${YELLOW}Starting development server...${NC}"
        cd "$NEBULAVM_HOME"
        npm run dev
        ;;
    repl)
        echo -e "${YELLOW}Launching NebulaVM REPL...${NC}"
        node -i -e "
            const CPU = require('$NEBULAVM_HOME/nebulavm.js');
            const Assembler = require('$NEBULAVM_HOME/nebulassembler.js');
            global.CPU = CPU;
            global.Assembler = Assembler;
            console.log('🌌 NebulaVM REPL');
            console.log('Available: CPU, Assembler');
            console.log('Example: let cpu = new CPU();');
        "
        ;;
    help|"")
        show_help
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        show_help
        exit 1
        ;;
esac
NVMBIN

chmod +x "$NVM_BIN"
echo -e "${GREEN}✅ Binary created at $NVM_BIN${NC}"

echo -e "${GREEN}[8/10]${NC} Creating NVM ASM template generator..."
cat > "$BIN_PATH/nvm-new" << 'NVMNEW'
#!/bin/bash
# Generate a new NVM Assembly project template

if [ -z "$1" ]; then
    echo "Usage: nvm-new <project-name>"
    exit 1
fi

PROJECT_DIR="$1"
mkdir -p "$PROJECT_DIR"

cat > "$PROJECT_DIR/main.asm" << 'EOF'
; NebulaVM Assembly Program
; Target: 8-bit Virtual Machine
; CPU: 8-bit RISC-sim with 256 bytes RAM

; --- PROGRAM START ---
START:
  ; Load Mouse X position from MMIO
  LDA [250]
  
  ; Load center constant (128 = screen center)
  LDB 128
  
  ; Subtract to get offset from center
  SUB
  
  ; Store result to video output (address 255)
  STA 255
  
  ; Loop back to start
  JMP START
EOF

cat > "$PROJECT_DIR/Makefile" << 'EOF'
.PHONY: build run clean

build:
	nvm compile main.asm

run: build
	nvm run main.nvm

clean:
	rm -f *.nvm
EOF

cat > "$PROJECT_DIR/README.md" << 'EOF'
# NebulaVM Project

This is a NebulaVM Assembly project.

## Files
- `main.asm` - Assembly source code
- `main.nvm` - Compiled binary (generated by `make build`)

## Building & Running
```bash
make build   # Compile assembly to binary
make run     # Compile and execute
make clean   # Remove build artifacts
```

## NVM Assembly Syntax
Basic instruction set for the 8-bit virtual machine:

| Instruction | Description |
|---|---|
| `LDA <value>` | Load Accumulator |
| `LDB <value>` | Load B Register |
| `STA <addr>` | Store Accumulator to address |
| `STB <addr>` | Store B Register to address |
| `ADD` | Add A and B |
| `SUB` | Subtract B from A |
| `JMP <label>` | Jump to label |
| `JZ <label>` | Jump if zero |
| `HLT` | Halt execution |

## Hardware Specs
- **RAM**: 256 bytes
- **Registers**: A, B, PC (Program Counter), ZF (Zero Flag)
- **MMIO Ports**: 
  - 250: Mouse X
  - 251: Mouse Y  
  - 255: Video Output

EOF

echo "✅ Project created in $PROJECT_DIR"
NVMNEW

chmod +x "$BIN_PATH/nvm-new"

echo -e "${GREEN}[9/10]${NC} Updating PATH..."
if ! grep -q "export PATH.*$BIN_PATH" "$PREFIX/etc/profile" 2>/dev/null; then
    echo "export PATH=\"$BIN_PATH:\$PATH\"" >> "$HOME/.bashrc"
    echo "export NEBULAVM_HOME=\"$NEBULAVM_HOME\"" >> "$HOME/.bashrc"
    echo "PATH has been updated in .bashrc"
fi

export PATH="$BIN_PATH:$PATH"
export NEBULAVM_HOME="$NEBULAVM_HOME"

echo ""
echo -e "${BLUE}=== PHASE 4: Verification ===${NC}"
echo -e "${GREEN}[10/10]${NC} Verifying installation..."

if command -v node &> /dev/null; then
    echo -e "${GREEN}✅ Node.js:${NC} $(node -v)"
fi

if command -v npm &> /dev/null; then
    echo -e "${GREEN}✅ npm:${NC} $(npm -v)"
fi

if [ -x "$NVM_BIN" ]; then
    echo -e "${GREEN}✅ NVM Binary:${NC} $NVM_BIN"
fi

if [ -x "$BIN_PATH/nvm-new" ]; then
    echo -e "${GREEN}✅ NVM Project Generator:${NC} $BIN_PATH/nvm-new"
fi

echo -e "${GREEN}✅ NebulaVM Home:${NC} $NEBULAVM_HOME"

echo ""
echo "================================"
echo -e "${GREEN}✅ INSTALLATION COMPLETE!${NC}"
echo "================================"
echo ""
echo -e "${YELLOW}🚀 QUICK START:${NC}"
echo ""
echo "1. Create a new project:"
echo "   ${GREEN}nvm-new my-program${NC}"
echo ""
echo "2. Write your assembly code in:"
echo "   ${GREEN}my-program/main.asm${NC}"
echo ""
echo "3. Build and run:"
echo "   ${GREEN}cd my-program && make run${NC}"
echo ""
echo -e "${YELLOW}📚 AVAILABLE COMMANDS:${NC}"
echo "   ${GREEN}nvm run <file.nvm>${NC}          - Execute binary"
echo "   ${GREEN}nvm compile <file.asm>${NC}      - Compile assembly"
echo "   ${GREEN}nvm dev${NC}                    - Start dev server"
echo "   ${GREEN}nvm repl${NC}                   - Interactive shell"
echo "   ${GREEN}nvm-new <project-name>${NC}    - Create new project"
echo ""
echo -e "${YELLOW}📂 PROJECT LOCATION:${NC}"
echo "   ${GREEN}$NEBULAVM_HOME${NC}"
echo ""
echo -e "${YELLOW}⚙️  RELOAD SHELL:${NC}"
echo "   ${GREEN}source ~/.bashrc${NC}"
echo ""
