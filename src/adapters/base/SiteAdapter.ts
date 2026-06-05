import type { GuardDestination } from "../../core";
import type { InputController } from "./InputController";
import type { SendController } from "./SendController";

export interface SiteAdapter {
  id: GuardDestination;
  label: string;
  matches(location: Location): boolean;
  findInput(): InputController | null;
  findSendControl(): SendController | null;
  mountPoint(input: InputController): HTMLElement;
}
