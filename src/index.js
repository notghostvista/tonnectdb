// Clear module cache to ensure fresh loading of files
Object.keys(require.cache).forEach(key => {
    delete require.cache[key];
});

require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Events, ChannelType, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

// Rate limiting system
const messageTracker = new Map();
const MESSAGE_LIMIT = 5;
const TIME_WINDOW = 60000; // 1 minute in milliseconds

function isRateLimited(userId) {
    const now = Date.now();
    const userMessages = messageTracker.get(userId) || { count: 0, timestamps: [] };

    // Remove timestamps older than the time window
    userMessages.timestamps = userMessages.timestamps.filter(timestamp => 
        now - timestamp < TIME_WINDOW
    );

    // Update count based on remaining timestamps
    userMessages.count = userMessages.timestamps.length;

    // Check if user has hit the limit
    if (userMessages.count >= MESSAGE_LIMIT) {
        return true;
    }

    // Add new message timestamp
    userMessages.timestamps.push(now);
    userMessages.count++;
    messageTracker.set(userId, userMessages);

    return false;
}

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    }
}

client.once(Events.ClientReady, () => {
    console.log(`Logged in as ${client.user.tag}`);
});

// Handle server joins to check for banned servers
client.on(Events.GuildCreate, async guild => {
    const config = require('./config/config.json');
    
    if (config.banned.servers.includes(guild.id)) {
        const embed = {
            color: 0xFF0000,
            title: 'Server Banned',
            description: 'This server has been banned from using TONNECT.',
            footer: {
                text: 'If you believe this is a mistake, please contact the bot owner.'
            },
            timestamp: new Date()
        };

        // Try to send the embed to the system channel or first available channel
        const notifyChannel = guild.systemChannel || guild.channels.cache.find(channel => 
            channel.type === ChannelType.GuildText && 
            channel.permissionsFor(client.user).has(PermissionFlagsBits.SendMessages)
        );

        if (notifyChannel) {
            await notifyChannel.send({ embeds: [embed] }).catch(console.error);
        }

        // Leave the server
        await guild.leave().catch(console.error);
    }
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        await interaction.reply({ 
            content: 'There was an error executing this command!', 
            ephemeral: true 
        });
    }
});

client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;
    
    const config = require('./config/config.json');
    
    // Check if message is in a configured cross-chat channel
    if (!config.channels[message.guild.id]) return;
    if (message.channel.id !== config.channels[message.guild.id]) return;

    // Check if server or user is banned
    if (config.banned.servers.includes(message.guild.id)) return;
    if (config.banned.users.includes(message.author.id)) return;

    // Check rate limit
    if (isRateLimited(message.author.id)) {
        await message.reply({ 
            content: 'You are sending messages too quickly! Please wait a minute before sending more messages.',
            ephemeral: true 
        }).catch(console.error);
        return;
    }

    // Delete original message
    await message.delete().catch(console.error);

    // Get user's highest role for emoji
    let roleEmoji = '';
    if (message.author.id === config.staff.owner) roleEmoji = config.emojis.owner;
    else if (config.staff.admins.includes(message.author.id)) roleEmoji = config.emojis.admin;
    else if (config.staff.moderators.includes(message.author.id)) roleEmoji = config.emojis.mod;

    // Create embed for cross-chat message
    const embed = {
        color: 0x0099ff,
        author: {
            name: `${message.author.tag} ${roleEmoji}`,
            icon_url: message.author.displayAvatarURL()
        },
        title: `Message from ${message.guild.name}`,
        thumbnail: {
            url: message.guild.iconURL()
        },
        description: message.content,
        fields: [],
        footer: {
            text: message.guild.name,
            icon_url: message.guild.iconURL()
        },
        timestamp: new Date()
    };

    // Add reply information if message is a reply
    if (message.reference && message.reference.messageId) {
        try {
            const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
            if (repliedMessage) {
                embed.fields.push({
                    name: '↪️ Replying to',
                    value: `**${repliedMessage.embeds[0]?.author?.name || 'Unknown User'}**\n${repliedMessage.embeds[0]?.description || repliedMessage.content || 'Original message not found'}`
                });
            }
        } catch (error) {
            console.error('Error fetching replied message:', error);
        }
    }

    // Add image if present
    const attachment = message.attachments.first();
    if (attachment && attachment.contentType?.startsWith('image/')) {
        embed.image = { url: attachment.url };
    }

    // Send to all configured channels
    for (const [guildId, channelId] of Object.entries(config.channels)) {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) continue;

        const channel = guild.channels.cache.get(channelId);
        if (!channel) continue;

        await channel.send({ embeds: [embed] }).catch(console.error);
    }
});

client.login(process.env.DISCORD_TOKEN);
