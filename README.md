# Shaked Music Bot

![License](https://img.shields.io/badge/License-MIT-green.svg)
![Node](https://img.shields.io/badge/Node-%3E%3D20.0.0-brightgreen.svg)
![Discord.js](https://img.shields.io/badge/Discord.js-v14-5865F2.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)

A feature-rich Discord music bot built with TypeScript and discord.js v14. Play music from YouTube in your Discord server with queue management, playlists, lyrics, autoplay, and more.

## Features

- **YouTube Playback** - Play songs via URL or search query
- **Queue Management** - Skip, shuffle, move, remove, and reorder tracks
- **Saved Playlists** - Create, manage, and play persistent playlists per server
- **Repeat Modes** - Off, single track, or entire queue looping
- **Autoplay** - Automatically queues related tracks when the queue runs out
- **Lyrics Lookup** - Fetch lyrics for the current or any specified track (via Genius)
- **Volume Control** - Per-server volume with persistent settings
- **Auto-Disconnect** - Leaves the voice channel after inactivity or when the channel is empty

## Commands

| Category | Command | Description |
|----------|---------|-------------|
| Music | `/play <query>` | Play a song (YouTube URL or search) |
| | `/pause` | Pause the current track |
| | `/resume` | Resume playback |
| | `/stop` | Stop playback and clear the queue |
| | `/skip` | Skip to the next track |
| | `/previous` | Play the previous track |
| | `/now-playing` | Show the currently playing track |
| | `/queue` | View the current queue |
| | `/volume` | Open the volume control panel |
| | `/lyrics [query]` | Get lyrics for a track |
| | `/autoplay` | Toggle autoplay mode |
| Queue | `/shuffle` | Shuffle the queue |
| | `/clear` | Clear the queue |
| | `/remove <position>` | Remove a track by position |
| | `/move <from> <to>` | Reorder a track in the queue |
| | `/repeat <mode>` | Set repeat mode (off/track/queue) |
| Voice | `/join` | Join your voice channel |
| | `/leave` | Leave the voice channel |
| Playlists | `/playlist-create <name>` | Create a new playlist |
| | `/playlist-delete <name>` | Delete a playlist |
| | `/playlist-add <name> <query>` | Add a track to a playlist |
| | `/playlist-remove <name> <pos>` | Remove a track from a playlist |
| | `/playlist-view <name>` | View tracks in a playlist |
| | `/playlist-play <name>` | Play a saved playlist |

## Prerequisites

- [Node.js](https://nodejs.org/) v20 or higher
- A [Discord bot token](https://discord.com/developers/applications)
- (Optional) A [Genius API key](https://genius.com/api-clients) for lyrics

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/ddex3/Shaked-Music-Bot.git
cd Shaked-Music-Bot
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example file and fill in your credentials:

```bash
cp .env.example .env
```

```env
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
GENIUS_API_KEY=your_genius_api_key_here
```

> **How to get a Genius API key (optional):**
> 1. Go to [genius.com/api-clients](https://genius.com/api-clients) and sign in (or create an account).
> 2. Click **Create an API Client** and fill in the app name and website URL (any URL works).
> 3. Once created, click **Generate Access Token** and copy it into your `.env` file.
> 4. Without this key the `/lyrics` command will be unavailable, but everything else works normally.

### 4. Deploy slash commands

Register the bot's slash commands with Discord:

```bash
npm run deploy
```

### 5. Start the bot

**Development:**

```bash
npm run dev
```

**Production:**

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── index.ts              # Bot entry point
├── deploy-commands.ts    # Slash command registration
├── config/config.ts      # Environment and bot configuration
├── core/
│   ├── GuildPlayer.ts    # Per-server audio player
│   ├── PlayerManager.ts  # Manages GuildPlayer instances
│   ├── Queue.ts          # Track queue
│   ├── Track.ts          # Track data model
│   └── VoiceManager.ts   # Voice connection handling
├── commands/             # Slash command handlers
├── database/
│   ├── connection.ts     # SQLite connection
│   └── schema.ts         # Database schema
├── services/
│   ├── YouTubeService.ts # YouTube search and streaming
│   ├── PlaylistService.ts# Playlist CRUD operations
│   └── LyricsService.ts  # Genius lyrics fetching
├── types/index.ts        # Shared TypeScript types
└── utils/logger.ts       # Startup logger
```

## Tech Stack

- **Runtime** - Node.js 20+
- **Language** - TypeScript 5.7
- **Discord Library** - discord.js v14
- **Voice** - @discordjs/voice with opusscript and libsodium
- **Audio** - ffmpeg-static
- **Database** - SQLite3 (persistent guild settings and playlists)
- **Lyrics** - genius-lyrics-api

## Support

If you run into any issues or have questions, [open an issue](https://github.com/ddex3/Shaked-Music-Bot/issues) on GitHub.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

Built with ❤️ by **[@ddex3](https://github.com/ddex3)**
