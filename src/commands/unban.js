const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unban a user or server from using the bot')
        .addSubcommand(subcommand =>
            subcommand
                .setName('user')
                .setDescription('Unban a user from using the bot')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to unban')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('server')
                .setDescription('Unban a server from using the bot')
                .addStringOption(option =>
                    option.setName('serverid')
                        .setDescription('The ID of the server to unban')
                        .setRequired(true))),
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
                content: 'Only administrators and the owner can unban servers!',
                ephemeral: true
            });
        }

        if (subcommand === 'user' && !isOwner && !isAdmin && !isMod) {
            return interaction.reply({
                content: 'You do not have permission to unban users!',
                ephemeral: true
            });
        }

        if (subcommand === 'user') {
            const user = interaction.options.getUser('user');
            const index = config.banned.users.indexOf(user.id);

            if (index > -1) {
                config.banned.users.splice(index, 1);
                fs.writeFileSync(configPath, JSON.stringify(config, null, 4));

                await interaction.reply({
                    content: `Successfully unbanned ${user.tag} from using the bot.`,
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: 'This user is not banned!',
                    ephemeral: true
                });
            }
        } else if (subcommand === 'server') {
            const serverId = interaction.options.getString('serverid');
            const index = config.banned.servers.indexOf(serverId);

            if (index > -1) {
                config.banned.servers.splice(index, 1);
                fs.writeFileSync(configPath, JSON.stringify(config, null, 4));

                await interaction.reply({
                    content: `Successfully unbanned server with ID ${serverId} from using the bot.`,
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: 'This server is not banned!',
                    ephemeral: true
                });
            }
        }
    },
};
