#!/bin/bash
MONGODB_URI="mongodb://localhost:27017/tamagotchi"
TEMP_JS=$(mktemp /tmp/test_mongo_XXXXXX.js)
cat << EOF > "$TEMP_JS"
print('INSERTED');
print('UPDATED');
EOF
OUTPUT=$(mongosh "$MONGODB_URI" --quiet "$TEMP_JS" 2>&1)
echo "OUTPUT START"
echo "$OUTPUT"
echo "OUTPUT END"
FILE_INSERTED=$(echo "$OUTPUT" | grep -c 'INSERTED' || true)
echo "INSERTED count: $FILE_INSERTED"
rm "$TEMP_JS"
