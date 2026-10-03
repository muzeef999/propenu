import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(process.cwd(), process.env.ENV_FILE || ".env"),
  quiet: true,
});
