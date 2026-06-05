import { defineContentScript } from "wxt/sandbox";
import "../src/ui/styles/guard.css";
import { startGuardAdapter } from "../src/adapters/base/domGuards";
import { localFixtureAdapter } from "../src/adapters/localFixture/adapter";

export default defineContentScript({
  matches: ["http://127.0.0.1/*", "http://127.0.0.1:*/*", "http://localhost/*", "http://localhost:*/*"],
  main() {
    if (localFixtureAdapter.matches(location)) {
      startGuardAdapter(localFixtureAdapter);
    }
  }
});
