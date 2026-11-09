export class UIEngine {
    private ctx: CanvasRenderingContext2D;

    constructor(canvasId: string) {
        let canvas: HTMLCanvasElement | null = null;

        if (typeof document !== 'undefined') {
            canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
        }

        if (!canvas) {
            if (typeof document !== 'undefined') {
                canvas = document.createElement('canvas');
                canvas.id = canvasId;
                canvas.width = 256;
                canvas.height = 256;
                document.body.appendChild(canvas);
            } else {
                const fallback = {
                    getContext: () => ({
                        fillStyle: '#000',
                        fillRect: () => {},
                    }),
                } as unknown as HTMLCanvasElement;
                this.ctx = fallback.getContext('2d') as CanvasRenderingContext2D;
                return;
            }
        }

        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error(`Unable to create 2D context for canvas "${canvasId}".`);
        }

        this.ctx = context;
    }

    render(memory: Uint8Array) {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, 256, 256);

        const x = memory[255] ?? 0;
        this.ctx.fillStyle = '#0f0';
        this.ctx.fillRect(x, 100, 10, 10);
    }
}
