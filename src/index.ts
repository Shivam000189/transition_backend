import { env } from "./db/env";


import app from "./app";
const PORT = env.port || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

