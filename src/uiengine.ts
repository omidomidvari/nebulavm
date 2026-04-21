import { NebulaMath } from './math.js';

export class UIEngine {
    private ctx: CanvasRenderingContext2D;
    
    constructor(canvasId: string) {
        const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        this.ctx = canvas.getContext('2d')!;
    }

    render(memory: Uint8Array) {
        // Clear frame
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, 256, 256);

        // Map memory address 255 to X position
        const x = memory[255];
        this.ctx.fillStyle = '#0f0';
        this.ctx.fillRect(x, 100, 10, 10);
    }
}
