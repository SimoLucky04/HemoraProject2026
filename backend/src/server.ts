import { createApp } from './app';
import { MemoryStore } from './data/memoryStore';

const port = Number(process.env.PORT || 4000);
const app = createApp(new MemoryStore());

const server = app.listen(port, () => {
  console.log(`Hemora demo backend listening on http://localhost:${port}`);
});

function shutdown() {
  server.close(() => {
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
