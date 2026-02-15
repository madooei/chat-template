import { createRouter } from "@nanostores/router";

export const $router = createRouter({
  home: "/",
  addChat: "/chats/new",
  messages: "/chats/:id/messages",
  editChat: "/chats/:id",
});
