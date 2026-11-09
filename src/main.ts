import { createSession } from "./game/game";
import { render } from "./game/render";
import { WORLD } from "./game/types";
import { createBrowserHost } from "./platform/browser/browserHost";

async function main(): Promise<void> {
  const root = document.querySelector("#app");
  if (!(root instanceof HTMLElement)) throw new Error("找不到 #app");
  try {
    await document.fonts.load('16px "SkyCourier SC"');
  } catch {
    // A missing face falls through the font stack.
  }

  const debug = new URLSearchParams(location.search).has("debug");
  const host = createBrowserHost(root, WORLD.width, WORLD.height);
  const session = createSession();
  host.onInput((event) => session.pointer(event));
  host.onFrame((dt) => {
    session.update(dt);
    for (const sound of session.takeSounds()) host.play(sound);
    render(host.ctx, session.model(), debug);
    host.setCursor(session.cursor());
  });
}

void main();
