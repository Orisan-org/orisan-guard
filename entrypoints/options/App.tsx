import { useEffect, useState } from "react";
import { allSensitivityClasses, defaultPolicy, type CustomTerm, type GuardMode, type GuardPolicy } from "../../src/core";
import { ModeSelector } from "../../src/ui/components/ModeSelector";

export function App() {
  const [mode, setMode] = useState<GuardMode>("assist");
  const [policy, setPolicy] = useState<GuardPolicy>(defaultPolicy);
  const [term, setTerm] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void chrome.runtime.sendMessage({ action: "LOAD_SETTINGS" }).then((response) => {
      if (response?.ok) {
        setMode(response.mode);
        setPolicy(response.policy);
      }
    });
  }, []);

  async function save(nextMode = mode, nextPolicy = policy) {
    await chrome.runtime.sendMessage({ action: "SAVE_SETTINGS", mode: nextMode, policy: nextPolicy });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1200);
  }

  function toggleClass(name: (typeof allSensitivityClasses)[number]) {
    const enabled = new Set(policy.enabledClasses);
    if (enabled.has(name)) enabled.delete(name);
    else enabled.add(name);
    const next = { ...policy, enabledClasses: [...enabled] };
    setPolicy(next);
    void save(mode, next);
  }

  function addTerm() {
    const value = term.trim();
    if (!value) return;
    const nextTerm: CustomTerm = {
      id: crypto.randomUUID(),
      value,
      strategy: "placeholder",
      sensitivityClass: "custom_term"
    };
    const next = { ...policy, customTerms: [...policy.customTerms, nextTerm] };
    setPolicy(next);
    setTerm("");
    void save(mode, next);
  }

  function removeTerm(id: string) {
    const next = { ...policy, customTerms: policy.customTerms.filter((item) => item.id !== id) };
    setPolicy(next);
    void save(mode, next);
  }

  return (
    <main>
      <h1>Orisan Guard Options</h1>
      <ModeSelector
        mode={mode}
        onChange={(next) => {
          setMode(next);
          void save(next, policy);
        }}
      />

      <section>
        <h2>Protected Classes</h2>
        <div className="grid">
          {allSensitivityClasses.map((name) => (
            <label key={name}>
              <input type="checkbox" checked={policy.enabledClasses.includes(name)} onChange={() => toggleClass(name)} />
              {name.replaceAll("_", " ")}
            </label>
          ))}
        </div>
      </section>

      <section>
        <h2>Custom Terms</h2>
        <div className="row">
          <input value={term} onChange={(event) => setTerm(event.currentTarget.value)} placeholder="Private customer or project" />
          <button type="button" onClick={addTerm}>
            Add
          </button>
        </div>
        <ul>
          {policy.customTerms.map((item) => (
            <li key={item.id}>
              {item.value}
              <button type="button" onClick={() => removeTerm(item.id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Evidence</h2>
        <label>
          <input
            type="checkbox"
            checked={policy.evidenceEnabled}
            onChange={(event) => {
              const next = { ...policy, evidenceEnabled: event.currentTarget.checked };
              setPolicy(next);
              void save(mode, next);
            }}
          />
          Local metadata evidence enabled
        </label>
        <button type="button" onClick={() => chrome.runtime.sendMessage({ action: "CLEAR_EVIDENCE" })}>
          Clear local evidence
        </button>
      </section>

      {saved ? <p role="status">Saved</p> : null}
    </main>
  );
}
