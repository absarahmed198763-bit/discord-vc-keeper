require('dotenv').config();

const { Client, GatewayIntentBits, ChannelType } = require('discord.js');
const {
  joinVoiceChannel,
  VoiceConnectionStatus,
  entersState
} = require('@discordjs/voice');

const { DISCORD_TOKEN, GUILD_ID, CHANNEL_ID } = process.env;

if (!DISCORD_TOKEN || !GUILD_ID || !CHANNEL_ID) {
  console.error('Missing DISCORD_TOKEN, GUILD_ID, or CHANNEL_ID environment variable.');
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
let reconnectTimer;
let joining = false;

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    joinTargetChannel();
  }, 10000);
}

async function joinTargetChannel() {
  if (joining) return;
  joining = true;

  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    const channel = await guild.channels.fetch(CHANNEL_ID);

    if (!channel || ![ChannelType.GuildVoice, ChannelType.GuildStageVoice].includes(channel.type)) {
      throw new Error('CHANNEL_ID must identify a voice or stage channel.');
    }

    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfMute: true,
      selfDeaf: true
    });

    connection.on('error', error => console.error('Voice connection error:', error));
    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      console.warn('Voice connection dropped; attempting recovery.');
      try {
        await Promise.race([
          entersState(connection, VoiceConnectionStatus.Signalling, 10000),
          entersState(connection, VoiceConnectionStatus.Connecting, 10000)
        ]);
      } catch {
        connection.destroy();
        scheduleReconnect();
      }
    });
    connection.on(VoiceConnectionStatus.Destroyed, scheduleReconnect);

    await entersState(connection, VoiceConnectionStatus.Ready, 30000);
    console.log(`Connected to voice channel: ${channel.name}`);
  } catch (error) {
    console.error('Could not join voice channel:', error.message);
    scheduleReconnect();
  } finally {
    joining = false;
  }
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  joinTargetChannel();
});

client.on('error', error => console.error('Discord client error:', error));
client.login(DISCORD_TOKEN);
