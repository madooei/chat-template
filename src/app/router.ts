import { createRouter } from "@nanostores/router";

export const $router = createRouter({
  home: "/",
  settings: "/settings",
  messages: "/chats/:id/messages",
});
