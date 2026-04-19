db = db.getSiblingDB('tamagotchi_e2e');

var passwordHash = "$2b$12$4QX2.DQYp9RgqiOnSoVI2OuE2y1aK92ZBoOfxoSuizRjNFhsQW6E2";

db.users.updateOne(
    { email: "estudiante@gmail.com" },
    {
        $setOnInsert: {
            email: "estudiante@gmail.com",
            password: passwordHash,
            role: "STUDENT",
            streak: NumberInt(0),
            createdAt: new Date(),
            __v: 0
        }
    },
    { upsert: true }
);

db.users.updateOne(
    { email: "admin@gmail.com" },
    {
        $setOnInsert: {
            email: "admin@gmail.com",
            password: passwordHash,
            role: "PROFESSOR",
            streak: NumberInt(0),
            createdAt: new Date(),
            __v: 0
        }
    },
    { upsert: true }
);

db.questions.updateOne(
    { text: "¿Por qué es importante usar HTML semántico en lugar de solo <div> y <span>?" },
    {
        $setOnInsert: {
            text: "¿Por qué es importante usar HTML semántico en lugar de solo <div> y <span>?",
            topic: "html",
            answer: "El HTML semántico mejora la accesibilidad, el SEO y la mantenibilidad del código.",
            active: true,
            __v: 0
        }
    },
    { upsert: true }
);

db.questions.updateOne(
    { text: "¿Por qué deberíamos usar const y let en lugar de var en JavaScript moderno?" },
    {
        $setOnInsert: {
            text: "¿Por qué deberíamos usar const y let en lugar de var en JavaScript moderno?",
            topic: "javascript",
            answer: "const y let tienen alcance de bloque, lo que evita errores y hace el código más predecible.",
            active: true,
            __v: 0
        }
    },
    { upsert: true }
);

db.questions.updateOne(
    { text: "¿Por qué es importante entender el modelo de caja (box model) en CSS?" },
    {
        $setOnInsert: {
            text: "¿Por qué es importante entender el modelo de caja (box model) en CSS?",
            topic: "css",
            answer: "El modelo de caja define cómo se calculan el tamaño y la posición de los elementos en la página.",
            active: true,
            __v: 0
        }
    },
    { upsert: true }
);

db.topics.updateOne({ name: "html" }, { $setOnInsert: { name: "html", enabled: true } }, { upsert: true });
db.topics.updateOne({ name: "javascript" }, { $setOnInsert: { name: "javascript", enabled: true } }, { upsert: true });
db.topics.updateOne({ name: "css" }, { $setOnInsert: { name: "css", enabled: true } }, { upsert: true });

print("E2E seed completado: 2 usuarios y 3 preguntas de topicos distintos insertados.");