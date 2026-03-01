type Emotion = 'neutral' | 'happy' | 'sad';

export class VirtualPet {
    private container: HTMLElement;
    private currentEmotion: Emotion = 'neutral';

    private readonly emotionToSvg: Record<Emotion, string> = {
        'neutral': 'logo.svg',
        'happy': 'logo-contento-boca-abierta.svg',
        'sad': 'logo-triste.svg'
    };

    constructor(containerId: string) {
        const element = document.getElementById(containerId);
        if (!element) {
            throw new Error(`Container ${containerId} not found`);
        }
        this.container = element;
        this.render();
    }

    setEmotion(emotion: Emotion): void {
        this.currentEmotion = emotion;
        this.render();
    }

    private render(): void {
        const svgPath = this.emotionToSvg[this.currentEmotion];
        this.container.innerHTML = `<img src="/${svgPath}" alt="Virtual Pet ${this.currentEmotion}" class="tamagotchi-svg">`;
        this.container.style.display = 'flex';
        this.container.style.justifyContent = 'center';
        this.container.style.alignItems = 'center';
    }
}
