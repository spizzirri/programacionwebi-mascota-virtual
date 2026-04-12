# Rule: No Comments in Code

## Rule
**DO NOT add comments in code files** unless explicitly requested by the user.

## Scope
This rule applies to ALL code files in the project, including:
- TypeScript files (`.ts`)
- JavaScript files (`.js`)
- Configuration files
- Test files (`.spec.ts`, `.test.ts`)

## Details
- Do NOT add inline comments (`// comment`)
- Do NOT add block comments (`/* comment */`)
- Do NOT add JSDoc comments unless explicitly requested
- Do NOT add TODO comments
- Do NOT add FIXME comments
- Do NOT add explanatory comments about what the code does

## Exception
Comments are ONLY allowed when:
1. The user explicitly requests them
2. Legal/license headers (if required)
3. Documentation generation tools require them (e.g., API documentation)

## Rationale
- Code should be self-documenting through clear naming and structure
- Comments become outdated and mislead developers
- Reduces visual clutter in code
- Forces developers to write clearer, more readable code

## Enforcement
When modifying any code file, ensure NO comments are present. If you encounter existing comments, leave them as-is unless the user asks you to remove them.
