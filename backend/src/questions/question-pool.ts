import { Question } from '../database/schemas/question.schema';

export class QuestionPool {
    constructor(private readonly questions: Question[]) { }

    get size(): number {
        return this.questions.length;
    }

    isEmpty(): boolean {
        return this.questions.length === 0;
    }

    pickRandom(): Question {
        const randomIndex = Math.floor(Math.random() * this.questions.length);
        return this.questions[randomIndex];
    }

    pickDifferentFrom(current: Question): Question {
        if (this.questions.length <= 1) {
            return this.pickRandom();
        }

        let next = current;
        while (next._id?.toString() === current._id?.toString()) {
            next = this.pickRandom();
        }
        return next;
    }

    filterByTopics(activeTopicNames: string[]): QuestionPool {
        const filtered = this.questions.filter(q => activeTopicNames.includes(q.topic));
        return new QuestionPool(filtered);
    }
}
