import { NebulaVM } from './nebulavm.js';
import { NebulaAssembler } from './nebulalaassembeler.js';
import { UIEngine } from './src/uiengine.js';
import { FileEngine } from './filemgr/fileengine.js';
import { InterruptType } from './src/interrupt.js';

const vm = new NebulaVM();
const ui = new UIEngine('screen');
const interruptCtrl = vm.getInterruptController();

// Example: Register a timer interrupt handler
interruptCtrl.registerHandler(
    100, // priority
    (vm) => {
        console.log('Timer interrupt fired!');
        // Handler logic here
    }
);

// Example: Register a keyboard interrupt handler
interruptCtrl.registerHandler(
    150, // higher priority
    (vm) => {
        console.log('Keyboard interrupt fired!');
        // Handler logic here
    }
);

const code = `LDA 0 LDB 1 ADD STA 255 SEI`;
const bin = NebulaAssembler.compile(code);

FileEngine.save('boot', bin);
vm.flash(bin);

function loop() {
    vm.step();
    ui.render(vm.mem);
    requestAnimationFrame(loop);
}
loop();

// Expose VM to global for testing interrupts
globalThis.nebulavm = vm;
globalThis.raiseInterrupt = (id) => vm.raiseInterrupt(id);
