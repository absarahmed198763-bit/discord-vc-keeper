# Discord VC Keeper

A Discord bot that joins one configured voice channel, self-mutes and self-deafens, and attempts to reconnect if the voice connection drops.

## Environment variables

Set these securely in your hosting provider:
- `DISCORD_TOKEN`
- `GUILD_ID`
- `CHANNEL_ID`

Do not commit a real `.env` file or bot token to GitHub.

## Run

```bash
npm install
npm start
```

The bot needs permission to view the channel and connect to it. The host must support a persistent Node.js process and Discord voice networking. Free hosting plans may sleep, stop, or impose usage limits, so uninterrupted 24/7 operation is not guaranteed.
