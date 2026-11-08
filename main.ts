import { NebulaVM } from './src/nebulavm.js';
import { NebulaAssembler } from './nebulalaassembeler.js';
import { UIEngine } from './src/uiengine.js';
import { FileEngine } from './filemgr/fileengine.js';
import { triggerCrashScreen } from './crashscreen.js';

const vm = new NebulaVM();
const ui = new UIEngine('screen');
const interruptCtrl = vm.getInterruptController();

interruptCtrl.registerHandler(100, () => {
  console.log('Timer interrupt fired!');
});

interruptCtrl.registerHandler(150, () => {
  console.log('Keyboard interrupt fired!');
});

const programSource = `
  LDA 0
  LDB 1
  ADD
  STA 255
  SEI
  HLT
`;

const bin = NebulaAssembler.compile(programSource);
FileEngine.save('boot', bin);
vm.flash(bin);

function loop() {
  try {
    vm.step();
    ui.render(vm.getState().memory);
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(loop);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    triggerCrashScreen('NEBULA_SYSTEM_FAILURE', {
      source: 'main.ts',
      reason: message,
      stack: error instanceof Error ? error.stack || '' : ''
    });
    throw error;
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    triggerCrashScreen('NEBULA_SYSTEM_FAILURE', {
      source: 'window.error',
      reason: event.message,
      stack: event.error?.stack || ''
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    triggerCrashScreen('NEBULA_SYSTEM_FAILURE', {
      source: 'unhandledrejection',
      reason: String(event.reason),
      stack: event.reason?.stack || ''
    });
  });

  loop();
}

(globalThis as any).nebulavm = vm;
(globalThis as any).raiseInterrupt = (id: number) => vm.raiseInterrupt(id);
