const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('staff')
        .setDescription('Manage bot staff')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a staff member')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to add as staff')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('role')
                        .setDescription('The staff role to give')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Admin', value: 'admin' },
                            { name: 'Moderator', value: 'mod' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a staff member')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('The user to remove from staff')
                        .setRequired(true))),
    async execute(interaction) {
        const configPath = path.join(__dirname, '../config/config.json');
        const config = require(configPath);

        // Only owner can manage staff
        if (interaction.user.id !== config.staff.owner) {
            return interaction.reply({
                content: 'Only the bot owner can manage staff!',
                ephemeral: true
            });
        }

        const subcommand = interaction.options.getSubcommand();
        const user = interaction.options.getUser('user');

        if (subcommand === 'add') {
            const role = interaction.options.getString('role');

            // Remove from other staff roles first
            config.staff.admins = config.staff.admins.filter(id => id !== user.id);
            config.staff.moderators = config.staff.moderators.filter(id => id !== user.id);

            // Add to new role
            if (role === 'admin') {
                config.staff.admins.push(user.id);
            } else if (role === 'mod') {
                config.staff.moderators.push(user.id);
            }

            fs.writeFileSync(configPath, JSON.stringify(config, null, 4));

            await interaction.reply({
                content: `Successfully added ${user.tag} as a ${role === 'admin' ? 'Admin' : 'Moderator'}.`,
                ephemeral: true
            });
        } else if (subcommand === 'remove') {
            let removed = false;

            // Remove from all staff roles
            if (config.staff.admins.includes(user.id)) {
                config.staff.admins = config.staff.admins.filter(id => id !== user.id);
                removed = true;
            }
            if (config.staff.moderators.includes(user.id)) {
                config.staff.moderators = config.staff.moderators.filter(id => id !== user.id);
                removed = true;
            }

            if (removed) {
                fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
                await interaction.reply({
                    content: `Successfully removed ${user.tag} from staff.`,
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: 'This user is not a staff member!',
                    ephemeral: true
                });
            }
        }
    },
};
