# Task Completion Checklist

## Before Committing Code

### 1. Code Quality

- [ ] TypeScript compiles without errors: `npm run build`
- [ ] No unused imports or variables
- [ ] All `.js` extensions added to import statements
- [ ] Error handling implemented for async operations
- [ ] User-facing error messages are clear and helpful

### 2. Testing

- [ ] Manual testing completed for affected features
- [ ] Test the CLI commands work as expected
- [ ] Verify streaming responses work correctly
- [ ] Check cost tracking displays properly
- [ ] Test error scenarios (invalid API key, network errors, etc.)

### 3. Code Style

- [ ] Following TypeScript strict mode requirements
- [ ] Consistent naming conventions (camelCase, PascalCase, kebab-case)
- [ ] Proper type annotations on public functions
- [ ] Zod schemas used for validation where appropriate

### 4. Documentation

- [ ] Update README.md if adding new features
- [ ] Add inline comments for complex logic
- [ ] Update CLI help text if commands changed

### 5. Git Workflow

- [ ] Changes staged: `git add .`
- [ ] Meaningful commit message prepared
- [ ] Commit pushed to GitHub: `git push origin main`

## When Adding New Features

### New CLI Command

1. Create command file in `src/commands/`
2. Implement command logic
3. Register command in `src/index.ts`
4. Update `src/commands/help.ts`
5. Update README.md usage section
6. Test command execution

### New OpenRouter Integration

1. Update `src/lib/openrouter.ts`
2. Update cost tracking if needed
3. Test API integration
4. Handle new error cases
5. Update token usage calculations

### New Display/UI Component

1. Add to `src/utils/display.ts`
2. Use chalk for consistent styling
3. Test in different terminal widths
4. Ensure accessibility (readable colors)

## Common Issues to Check

### Import Errors

- Ensure all imports have `.js` extension
- Check module resolution in tsconfig.json

### Runtime Errors

- Verify API key is configured: `npm run dev -- init`
- Check network connectivity
- Verify OpenRouter API status

### Build Errors

- Clear dist folder: `rm -rf dist`
- Rebuild: `npm run build`
- Check TypeScript version compatibility

## No Automated Tools Currently

⚠️ **Note**: This project does not currently have:

- Linting (eslint)
- Formatting (prettier)
- Unit tests
- Integration tests
- CI/CD pipeline

These may be added in future updates.
