import { Injectable, OnModuleInit } from '@nestjs/common';
import { DatabaseService, Question } from '../database/database.service';

@Injectable()
export class QuestionsService implements OnModuleInit {
    constructor(private readonly db: DatabaseService) { }

    async onModuleInit() {
        // Seed questions on startup
        await this.seedQuestions();
    }

    private async seedQuestions() {
        const existingQuestions = await this.db.getAllQuestions();
        if (existingQuestions.length > 0) {
            return; // Already seeded
        }

        const questions: Omit<Question, '_id'>[] = [
            { text: '¿Qué significa HTML?', topic: 'basics' },
            { text: '¿Cuál es la diferencia entre <div> y <span>?', topic: 'tags' },
            { text: '¿Para qué se usa la etiqueta <header>?', topic: 'semantic' },
            { text: '¿Qué atributo se usa para identificar únicamente un elemento?', topic: 'attributes' },
            { text: '¿Cuál es la diferencia entre <strong> y <b>?', topic: 'tags' },
            { text: '¿Para qué sirve el atributo "alt" en las imágenes?', topic: 'attributes' },
            { text: '¿Qué etiqueta se usa para crear un enlace?', topic: 'tags' },
            { text: '¿Cuál es la estructura básica de un documento HTML?', topic: 'basics' },
            { text: '¿Qué diferencia hay entre <ol> y <ul>?', topic: 'lists' },
            { text: '¿Para qué se usa la etiqueta <meta>?', topic: 'metadata' },
            { text: '¿Qué es el atributo "placeholder" en un input?', topic: 'forms' },
            { text: '¿Cuál es la diferencia entre <section> y <article>?', topic: 'semantic' },
            { text: '¿Para qué sirve la etiqueta <nav>?', topic: 'semantic' },
            { text: '¿Qué tipos de input existen en HTML5?', topic: 'forms' },
            { text: '¿Cómo se crea una tabla en HTML?', topic: 'tables' },
            { text: '¿Qué es el atributo "required" en un formulario?', topic: 'forms' },
            { text: '¿Para qué se usa la etiqueta <footer>?', topic: 'semantic' },
            { text: '¿Qué diferencia hay entre <em> y <i>?', topic: 'tags' },
            { text: '¿Cómo se incluye un video en HTML5?', topic: 'multimedia' },
            { text: '¿Qué es el atributo "href" y dónde se usa?', topic: 'attributes' },
            { text: '¿Para qué sirve la etiqueta <label> en formularios?', topic: 'forms' },
            { text: '¿Qué es el DOCTYPE y para qué sirve?', topic: 'basics' },
            { text: '¿Cómo se crea un comentario en HTML?', topic: 'basics' },
            { text: '¿Qué diferencia hay entre atributos "class" e "id"?', topic: 'attributes' },
            { text: '¿Para qué se usa la etiqueta <aside>?', topic: 'semantic' },
        ];

        for (const question of questions) {
            await this.db.createQuestion(question);
        }
    }

    async getRandomQuestion(): Promise<Question> {
        const questions = await this.db.getAllQuestions();
        const randomIndex = Math.floor(Math.random() * questions.length);
        return questions[randomIndex];
    }
}
