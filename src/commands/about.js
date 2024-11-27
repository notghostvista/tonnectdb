const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('about')
        .setDescription('Shows information about TONNECT'),
    async execute(interaction) {
        const embed = {
            color: 0x0099ff,
            title: 'About TONNECT',
            description: 'TONNECT is a powerful cross-server chat bot that allows communities to connect and communicate seamlessly.',
    
            thumbnail: {
                url: interaction.client.user.displayAvatarURL()
            },
            footer: {
                text: 'TONNECT - Connecting Communities'
            },
            timestamp: new Date()
        };

        await interaction.reply({ embeds: [embed] });
    },
};
