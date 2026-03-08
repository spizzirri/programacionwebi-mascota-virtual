db = db.getSiblingDB('tamagotchi_e2e');

var passwordHash = "$2b$10$eyTT939IAmBiXRyRlpHEQeE91NRJ4WxfwSiDUtvXnFLgal99qAJ2q";

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
            topic: "html_semantico",
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
            topic: "css_modelo_caja",
            active: true,
            __v: 0
        }
    },
    { upsert: true }
);

db.topics.updateOne({ name: "html_semantico" }, { $setOnInsert: { name: "html_semantico", enabled: true } }, { upsert: true });
db.topics.updateOne({ name: "javascript" }, { $setOnInsert: { name: "javascript", enabled: true } }, { upsert: true });
db.topics.updateOne({ name: "css_modelo_caja" }, { $setOnInsert: { name: "css_modelo_caja", enabled: true } }, { upsert: true });

print("E2E seed completado: 2 usuarios y 3 preguntas de topicos distintos insertados.");
