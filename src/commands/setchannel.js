const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setchannel')
        .setDescription('Set the cross-chat channel for this server')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to use for cross-chat')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');
        const configPath = path.join(__dirname, '../config/config.json');
        const config = require(configPath);

        config.channels[interaction.guild.id] = channel.id;

        fs.writeFileSync(configPath, JSON.stringify(config, null, 4));

        await interaction.reply({
            content: `Successfully set ${channel} as the cross-chat channel!`,
            ephemeral: true
        });
    },
};
