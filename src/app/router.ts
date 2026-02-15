import { createRouter } from "@nanostores/router";

export const $router = createRouter({
  home: "/",
  settings: "/settings",
  addChat: "/chats/new",
  messages: "/chats/:id/messages",
  editChat: "/chats/:id",
});
