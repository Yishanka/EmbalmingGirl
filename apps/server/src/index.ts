import { Server, Origins } from 'boardgame.io/server';
import { EmbalmingGirlGame } from 'shared';

const server = Server({
    games: [EmbalmingGirlGame],
    origins: [Origins.LOCALHOST], // 启用 CORS，允许 localhost:3000 访问
});

server.run(8000, () => {
    console.log("Server running on http://localhost:8000");
});