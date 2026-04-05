import app from "./src/app.js";
import { env } from "./src/config/env.js";

const PORT = env.port;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${server.address().port}`);
});
