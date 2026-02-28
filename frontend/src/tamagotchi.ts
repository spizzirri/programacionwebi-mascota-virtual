type Emotion = 'neutral' | 'happy' | 'sad';

export class Tamagotchi {
    private container: HTMLElement;
    private currentEmotion: Emotion = 'neutral';

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
        const svg = this.createSVG();
        this.container.innerHTML = '';
        this.container.style.display = 'flex';
        this.container.style.justifyContent = 'center';
        this.container.style.alignItems = 'center';
        this.container.appendChild(svg);
    }

    private createSVG(): SVGElement {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 200 200');
        svg.setAttribute('class', 'tamagotchi-svg');
        svg.setAttribute('width', '300');
        svg.setAttribute('height', '300');

        const bg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        bg.setAttribute('cx', '100');
        bg.setAttribute('cy', '100');
        bg.setAttribute('r', '95');
        bg.setAttribute('fill', '#4caf50');
        svg.appendChild(bg);

        const birdGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        const whiteBase = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        whiteBase.setAttribute('d', 'M 35,103 C 35,65 65,35 103,35 C 130,35 155,60 165,85 L 165,105 L 140,105 C 140,125 120,145 95,145 C 70,145 50,125 50,105 L 35,105 Z');
        whiteBase.setAttribute('fill', 'white');
        birdGroup.appendChild(whiteBase);

        const tail = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        tail.setAttribute('d', 'M 165,105 A 65,65 0 0,1 100,170 A 65,65 0 0,1 35,105 L 52,105 A 48,48 0 0,0 100,153 A 48,48 0 0,0 148,105 Z');
        tail.setAttribute('fill', 'white');
        birdGroup.appendChild(tail);
        for (let i = 0; i < 3; i++) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const offset = (i + 1) * 12;
            line.setAttribute('d', `M ${95 + offset},41 Q ${140 + offset},45 ${155},${80 + offset}`);
            line.setAttribute('stroke', '#4caf50');
            line.setAttribute('stroke-width', '8');
            line.setAttribute('fill', 'none');
            line.setAttribute('stroke-linecap', 'round');
            birdGroup.appendChild(line);
        }

        svg.appendChild(birdGroup);

        const leftEye = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        leftEye.setAttribute('cx', '75');
        leftEye.setAttribute('cy', '95');
        leftEye.setAttribute('r', '7');
        leftEye.setAttribute('fill', '#1a1a1b');
        svg.appendChild(leftEye);

        const rightEye = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        rightEye.setAttribute('cx', '115');
        rightEye.setAttribute('cy', '95');
        rightEye.setAttribute('r', '7');
        rightEye.setAttribute('fill', '#1a1a1b');
        svg.appendChild(rightEye);

        const mouth = this.createMouth();
        svg.appendChild(mouth);

        return svg;
    }

    private createMouth(): SVGElement {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        if (this.currentEmotion === 'happy') {
            const mouth = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            mouth.setAttribute('d', 'M 85,115 Q 100,145 115,115 L 115,115 Q 100,125 85,115 Z');
            mouth.setAttribute('fill', '#3c2a2e');
            g.appendChild(mouth);
            const tongue = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            tongue.setAttribute('d', 'M 92,130 Q 100,138 108,130');
            tongue.setAttribute('stroke', '#e91e63');
            tongue.setAttribute('stroke-width', '4');
            tongue.setAttribute('fill', 'none');
            tongue.setAttribute('stroke-linecap', 'round');
            g.appendChild(tongue);
        } else if (this.currentEmotion === 'sad') {
            const mouth = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            mouth.setAttribute('d', 'M 85,125 Q 100,110 115,125');
            mouth.setAttribute('stroke', '#1a1a1b');
            mouth.setAttribute('stroke-width', '4');
            mouth.setAttribute('fill', 'none');
            mouth.setAttribute('stroke-linecap', 'round');
            g.appendChild(mouth);
        } else {
            const mouth = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            mouth.setAttribute('d', 'M 85,115 Q 100,125 115,115');
            mouth.setAttribute('stroke', '#1a1a1b');
            mouth.setAttribute('stroke-width', '3');
            mouth.setAttribute('fill', 'none');
            mouth.setAttribute('stroke-linecap', 'round');
            g.appendChild(mouth);
        }

        return g;
    }
}
