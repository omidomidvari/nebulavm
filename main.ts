import { NebulaVM } from './src/nebulavm.js';
import { NebulaAssembler } from './nebulalaassembeler.js';
import { UIEngine } from './src/uiengine.js';
import { FileEngine } from './filemgr/fileengine.js';
import { InterruptType } from './src/interrupt.js';

const vm = new NebulaVM();
const ui = new UIEngine('screen');
const interruptCtrl = vm.getInterruptController();

interruptCtrl.registerHandler(100, (vm) => {
    console.log('Timer interrupt fired!');
});

interruptCtrl.registerHandler(150, (vm) => {
    console.log('Keyboard interrupt fired!');
});

const code = `LDA 0 LDB 1 ADD STA 255 SEI`;
const bin = NebulaAssembler.compile(code);

FileEngine.save('boot', bin);
vm.flash(bin);

function loop() {
    vm.step();
    ui.render(vm.getState().memory);
    requestAnimationFrame(loop);
}

if (typeof window !== 'undefined') {
    loop();
}

globalThis.nebulavm = vm;
globalThis.raiseInterrupt = (id: number) => vm.raiseInterrupt(id);
