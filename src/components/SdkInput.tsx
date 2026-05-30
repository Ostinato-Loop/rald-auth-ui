import { useState, type InputHTMLAttributes, forwardRef } from "react";

export type SdkState = "idle" | "typing" | "processing" | "verified" | "error";

interface SdkInputProps extends InputHTMLAttributes<HTMLInputElement> {
  state?: SdkState;
  label?: string;
  hint?: string;
}

const SdkInput = forwardRef<HTMLInputElement, SdkInputProps>(
  ({ state = "idle", label, hint, className, onChange, ...props }, ref) => {
    const [internalState, setInternalState] = useState<SdkState>(state);
    const activeState = state !== "idle" ? state : internalState;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (state === "idle") setInternalState(e.target.value ? "typing" : "idle");
      onChange?.(e);
    };

    return (
      <div>
        {label && <label className="label">{label}</label>}
        <div className="sdk-wrap" data-state={activeState}>
          <input
            ref={ref}
            className="rald-input"
            onChange={handleChange}
            {...props}
          />
        </div>
        {hint && <p className="hint" style={{ marginTop: 6 }}>{hint}</p>}
      </div>
    );
  }
);

SdkInput.displayName = "SdkInput";
export default SdkInput;
