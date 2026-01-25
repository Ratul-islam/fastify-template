import Fastify from "fastify";
import AutoLoad from "@fastify/autoload";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { connectDB } from "./config/db.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function buildApp() {
  const app = Fastify({ logger: true });

  await connectDB();

  await app.register(AutoLoad, {
    dir: path.join(__dirname, "plugins"),
    encapsulate: false, 
  });

  await app.register(AutoLoad, {
    dir: path.join(__dirname, "modules"),
    matchFilter:  (p) => /\.routes\.(ts|js)$/.test(p),
    options: { prefix: "/api/v1" },
  });


  app.ready(() => {
    console.log(app.printRoutes());
  });

  return app;
}
