const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { ChannelType, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user or server from using the bot')
        .addSubcommand(subcommand =>
            subcommand
                .setName('user')
                .setDescription('Ban a user from using the bot')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to ban')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for the ban')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('server')
                .setDescription('Ban a server from using the bot')
                .addStringOption(option =>
                    option.setName('serverid')
                        .setDescription('The ID of the server to ban')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for the ban'))),
    async execute(interaction) {
        const configPath = path.join(__dirname, '../config/config.json');
        const config = require(configPath);

        // Check permissions
        const isOwner = interaction.user.id === config.staff.owner;
        const isAdmin = config.staff.admins.includes(interaction.user.id);
        const isMod = config.staff.moderators.includes(interaction.user.id);

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'server' && !isOwner && !isAdmin) {
            return interaction.reply({
                content: 'Only administrators and the owner can ban servers!',
                ephemeral: true
            });
        }

        if (subcommand === 'user' && !isOwner && !isAdmin && !isMod) {
            return interaction.reply({
                content: 'You do not have permission to ban users!',
                ephemeral: true
            });
        }

        if (subcommand === 'user') {
            const user = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason') || 'No reason provided';

            if (user.id === config.staff.owner || 
                config.staff.admins.includes(user.id) || 
                config.staff.moderators.includes(user.id)) {
                return interaction.reply({
                    content: 'You cannot ban staff members!',
                    ephemeral: true
                });
            }

            if (!config.banned.users.includes(user.id)) {
                config.banned.users.push(user.id);
                fs.writeFileSync(configPath, JSON.stringify(config, null, 4));

                // Send DM to banned user
                const dmEmbed = {
                    color: 0xFF0000,
                    title: 'You have been banned',
                    description: `You have been banned from using TONNECT.\nReason: ${reason}`,
                    footer: {
                        text: 'If you believe this is a mistake, please contact the bot owner.'
                    },
                    timestamp: new Date()
                };

                try {
                    await user.send({ embeds: [dmEmbed] });
                } catch (error) {
                    console.error('Could not DM banned user:', error);
                }

                await interaction.reply({
                    content: `Successfully banned ${user.tag} from using the bot.\nReason: ${reason}`,
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: 'This user is already banned!',
                    ephemeral: true
                });
            }
        } else if (subcommand === 'server') {
            const serverId = interaction.options.getString('serverid');
            const reason = interaction.options.getString('reason') || 'No reason provided';

            if (!config.banned.servers.includes(serverId)) {
                config.banned.servers.push(serverId);
                fs.writeFileSync(configPath, JSON.stringify(config, null, 4));

                // Get the server and leave it if the bot is in it
                const guild = interaction.client.guilds.cache.get(serverId);
                if (guild) {
                    const leaveEmbed = {
                        color: 0xFF0000,
                        title: 'Server Banned',
                        description: `This server has been banned from using TONNECT.\nReason: ${reason}`,
                        footer: {
                            text: 'If you believe this is a mistake, please contact the bot owner.'
                        },
                        timestamp: new Date()
                    };

                    // Try to send the embed to the system channel or first available channel
                    const notifyChannel = guild.systemChannel || guild.channels.cache.find(channel => 
                        channel.type === ChannelType.GuildText && 
                        channel.permissionsFor(interaction.client.user).has(PermissionFlagsBits.SendMessages)
                    );

                    if (notifyChannel) {
                        await notifyChannel.send({ embeds: [leaveEmbed] }).catch(console.error);
                    }

                    await guild.leave().catch(console.error);
                }

                await interaction.reply({
                    content: `Successfully banned server with ID ${serverId} from using the bot.\nReason: ${reason}`,
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: 'This server is already banned!',
                    ephemeral: true
                });
            }
        }
    },
};
