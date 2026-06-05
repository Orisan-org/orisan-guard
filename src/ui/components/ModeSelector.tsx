import type { GuardMode } from "../../core";

interface ModeSelectorProps {
  mode: GuardMode;
  onChange: (mode: GuardMode) => void;
}

export function ModeSelector({ mode, onChange }: ModeSelectorProps) {
  const modes: GuardMode[] = ["assist", "auto_protect", "strict", "custom"];
  return (
    <label className="field">
      <span>Mode</span>
      <select value={mode} onChange={(event) => onChange(event.currentTarget.value as GuardMode)}>
        {modes.map((item) => (
          <option key={item} value={item}>
            {item.replace("_", " ")}
          </option>
        ))}
      </select>
    </label>
  );
}
