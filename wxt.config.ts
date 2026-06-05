import { defineConfig } from "wxt";
export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Orisan Guard",
    version: "0.1.0",
    permissions: ["storage", "activeTab"],
    host_permissions: [
      "https://chatgpt.com/*",
      "https://chat.openai.com/*",
      "http://127.0.0.1/*",
      "http://127.0.0.1:*/*"
    ],
    action: {
      default_title: "Orisan Guard"
    },
    options_ui: {
      page: "options.html",
      open_in_tab: true
    },
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self';"
    }
  }
});
