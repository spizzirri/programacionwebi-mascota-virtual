#!/bin/bash
QUESTION="Value is \$PATH"
QUESTION_ESCAPED=$(echo "$QUESTION" | sed "s/'/\\\\'/g")
cat << EOF
{ text: '${QUESTION_ESCAPED}' }
EOF
