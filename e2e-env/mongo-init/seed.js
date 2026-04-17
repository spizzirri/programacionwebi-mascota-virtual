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

print("E2E seed completado: 2 usuarios insertados.");
