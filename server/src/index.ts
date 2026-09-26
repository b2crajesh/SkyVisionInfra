import { createApp } from "./app";
import { env } from "./utils/env";

const app = createApp();

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Sky Vision Infra & Developers API listening on port ${env.PORT} [${env.NODE_ENV}]`);
});
