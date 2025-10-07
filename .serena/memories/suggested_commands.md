# Suggested Commands

## Development

```bash
# Install dependencies
npm install

# Run in development mode (with hot reload)
npm run dev -- <command>

# Examples:
npm run dev -- init        # Initialize configuration
npm run dev -- chat        # Start chat session
npm run dev -- models      # List available models
npm run dev -- help        # Show help
```

## Building

```bash
# Build TypeScript to JavaScript
npm run build

# Run built version
npm start
```

## Application Commands

```bash
# Initialize configuration (first-time setup)
npm run dev -- init

# Start interactive chat with default model
npm run dev -- chat

# Start chat with specific model
npm run dev -- chat --model anthropic/claude-3-opus
npm run dev -- chat --model openai/gpt-4o

# List all available models
npm run dev -- models

# Show help information
npm run dev -- help
```

## In-Chat Commands

When inside a chat session:

```
/model <model-name>  # Switch to different model
/models              # Show available models
/clear               # Clear conversation history
/cost                # Show session cost summary
/help                # Show available commands
/exit                # End chat session
```

## Git Commands

```bash
# Stage changes
git add .

# Commit changes
git commit -m "Your message"

# Push to GitHub
git push origin main

# Check status
git status

# View commit history
git log --oneline
```

## System Commands (macOS/Darwin)

```bash
# List directory contents
ls -la

# Find files
find . -name "*.ts"

# Search file contents
grep -r "search term" src/

# View file
cat filename.ts

# View with line numbers
cat -n filename.ts

# Count lines
wc -l filename.ts

# Process management
ps aux | grep node
```

## Debugging

```bash
# Check Node version
node --version

# Check npm version
npm --version

# View package.json scripts
npm run

# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json && npm install
```

## Configuration

Configuration is stored at:

- **macOS**: `~/Library/Preferences/ai-coding-cli-nodejs/config.json`
- **View config location**: In code via `configManager.getConfigPath()`
