import { NebulaVM } from './src/nebulavm.js';
import { NebulaAssembler } from './nebulalaassembeler.js';
import { UIEngine } from './src/uiengine.js';
import { FileEngine } from './filemgr/fileengine.js';
import { assertValidProgram } from './corruptedfilechecker.js';
import { triggerCrashScreen } from './crashscreen.js';

const vm = new NebulaVM();
const ui = new UIEngine('screen');
const interruptCtrl = vm.getInterruptController();

interruptCtrl.registerHandler(100, () => console.log('Timer interrupt fired!'));
interruptCtrl.registerHandler(150, () => console.log('Keyboard interrupt fired!'));

const programSource = `
  LDA 0
  LDB 1
  ADD
  STA 255
  SEI
  HLT
`;

const bin = assertValidProgram(NebulaAssembler.compile(programSource), 256);
FileEngine.save('boot', bin);
vm.flash(bin);

function loop() {
  try {
    vm.step();
    ui.render(vm.getState().memory);
    if (typeof requestAnimationFrame === 'function' && !vm.getState().halted) requestAnimationFrame(loop);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    triggerCrashScreen('NEBULA_SYSTEM_FAILURE', {
      source: 'main.ts', reason: message, stack: error instanceof Error ? error.stack || '' : '',
    });
    throw error;
  }
}

if (typeof window !== 'undefined') loop();

(globalThis).nebulavm = vm;
(globalThis).raiseInterrupt = (id) => vm.raiseInterrupt(id);
