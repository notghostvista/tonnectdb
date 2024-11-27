# TONNECT - Cross-Server Chat Bot

TONNECT is a powerful Discord bot that enables cross-server communication with advanced moderation features.

## Features

- Cross-server chat with embedded messages
- Image support
- Staff hierarchy system (Owner, Admin, Moderator)
- Advanced moderation commands
- Real-time configuration
- Server and user ban system

## Setup

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file with the following content:
```env
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_bot_client_id
```

4. Deploy the slash commands:
```bash
node src/deploy-commands.js
```

5. Start the bot:
```bash
node src/index.js
```

## Commands

### General
- `/about` - Display information about the bot

### Configuration
- `/setchannel` - Set the cross-chat channel for the server (Admin only)

### Moderation
- `/ban user` - Ban a user from using the bot (Mod+)
- `/ban server` - Ban a server from using the bot (Admin+)
- `/unban user` - Unban a user from using the bot (Mod+)
- `/unban server` - Unban a server from using the bot (Admin+)

### Staff Management
- `/staff add` - Add a staff member (Owner only)
- `/staff remove` - Remove a staff member (Owner only)

## Staff Hierarchy

- 👑 Owner - Full control over the bot
- ⭐ Admin - Can ban/unban users and servers
- 🛡️ Mod - Can ban/unban users

## License

MIT License
