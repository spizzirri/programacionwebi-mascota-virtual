// Tamagotchi component with emotional states

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
        this.container.appendChild(svg);
    }

    private createSVG(): SVGElement {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 200 200');
        svg.setAttribute('class', 'tamagotchi-svg');

        // Body
        const body = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        body.setAttribute('cx', '100');
        body.setAttribute('cy', '110');
        body.setAttribute('rx', '70');
        body.setAttribute('ry', '80');
        body.setAttribute('fill', '#6366f1');
        svg.appendChild(body);

        // Head
        const head = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        head.setAttribute('cx', '100');
        head.setAttribute('cy', '60');
        head.setAttribute('r', '50');
        head.setAttribute('fill', '#8b5cf6');
        svg.appendChild(head);

        // Eyes
        const leftEye = this.createEye(75, 55);
        const rightEye = this.createEye(125, 55);
        svg.appendChild(leftEye);
        svg.appendChild(rightEye);

        // Mouth based on emotion
        const mouth = this.createMouth();
        svg.appendChild(mouth);

        // Cheeks (for happy emotion)
        if (this.currentEmotion === 'happy') {
            const leftCheek = this.createCheek(60, 70);
            const rightCheek = this.createCheek(140, 70);
            svg.appendChild(leftCheek);
            svg.appendChild(rightCheek);
        }

        // Tears (for sad emotion)
        if (this.currentEmotion === 'sad') {
            const leftTear = this.createTear(70, 75);
            const rightTear = this.createTear(130, 75);
            svg.appendChild(leftTear);
            svg.appendChild(rightTear);
        }

        // Arms
        const leftArm = this.createArm(40, 120, -20);
        const rightArm = this.createArm(160, 120, 20);
        svg.appendChild(leftArm);
        svg.appendChild(rightArm);

        // Feet
        const leftFoot = this.createFoot(70, 180);
        const rightFoot = this.createFoot(130, 180);
        svg.appendChild(leftFoot);
        svg.appendChild(rightFoot);

        return svg;
    }

    private createEye(cx: number, cy: number): SVGElement {
        const eye = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        eye.setAttribute('cx', cx.toString());
        eye.setAttribute('cy', cy.toString());
        eye.setAttribute('r', '8');
        eye.setAttribute('fill', '#ffffff');

        const pupil = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        pupil.setAttribute('cx', cx.toString());
        pupil.setAttribute('cy', cy.toString());
        pupil.setAttribute('r', '4');
        pupil.setAttribute('fill', '#0a0e1a');

        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.appendChild(eye);
        group.appendChild(pupil);

        return group;
    }

    private createMouth(): SVGElement {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('stroke', '#ffffff');
        path.setAttribute('stroke-width', '3');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke-linecap', 'round');

        switch (this.currentEmotion) {
            case 'happy':
                // Smile
                path.setAttribute('d', 'M 75 75 Q 100 90 125 75');
                break;
            case 'sad':
                // Frown
                path.setAttribute('d', 'M 75 85 Q 100 70 125 85');
                break;
            case 'neutral':
            default:
                // Straight line
                path.setAttribute('d', 'M 80 80 L 120 80');
                break;
        }

        return path;
    }

    private createCheek(cx: number, cy: number): SVGElement {
        const cheek = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        cheek.setAttribute('cx', cx.toString());
        cheek.setAttribute('cy', cy.toString());
        cheek.setAttribute('r', '8');
        cheek.setAttribute('fill', '#ec4899');
        cheek.setAttribute('opacity', '0.6');
        return cheek;
    }

    private createTear(cx: number, cy: number): SVGElement {
        const tear = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        tear.setAttribute('d', `M ${cx} ${cy} Q ${cx - 2} ${cy + 8} ${cx} ${cy + 12} Q ${cx + 2} ${cy + 8} ${cx} ${cy}`);
        tear.setAttribute('fill', '#60a5fa');
        tear.setAttribute('opacity', '0.8');

        // Animate tear
        const animate = document.createElementNS('http://www.w3.org/2000/svg', 'animateTransform');
        animate.setAttribute('attributeName', 'transform');
        animate.setAttribute('type', 'translate');
        animate.setAttribute('from', '0 0');
        animate.setAttribute('to', '0 10');
        animate.setAttribute('dur', '1s');
        animate.setAttribute('repeatCount', 'indefinite');
        tear.appendChild(animate);

        return tear;
    }

    private createArm(cx: number, cy: number, rotation: number): SVGElement {
        const arm = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        arm.setAttribute('cx', cx.toString());
        arm.setAttribute('cy', cy.toString());
        arm.setAttribute('rx', '15');
        arm.setAttribute('ry', '35');
        arm.setAttribute('fill', '#6366f1');
        arm.setAttribute('transform', `rotate(${rotation} ${cx} ${cy})`);
        return arm;
    }

    private createFoot(cx: number, cy: number): SVGElement {
        const foot = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        foot.setAttribute('cx', cx.toString());
        foot.setAttribute('cy', cy.toString());
        foot.setAttribute('rx', '20');
        foot.setAttribute('ry', '12');
        foot.setAttribute('fill', '#8b5cf6');
        return foot;
    }
}
