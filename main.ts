import { NebulaVM } from './nebulavm.js';
import { NebulaAssembler } from './nebulalaassembler.js';
import { UIEngine } from './src/uiengine.js';
import { FileEngine } from './filemgr/fileengine.js';

const vm = new NebulaVM();
const ui = new UIEngine('screen');

const code = `LDA 0 LDB 1 ADD STA 255`;
const bin = NebulaAssembler.compile(code);

FileEngine.save('boot', bin);
vm.flash(bin);

function loop() {
    vm.step();
    ui.render(vm.mem);
    requestAnimationFrame(loop);
}
loop();
