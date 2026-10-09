import { ImagePlus } from 'lucide-react';
import { Input, Textarea } from '../../../components/ui/index.js';
import { EMERGENCY_LEVELS } from '../../../types/constants.js';
import { cn } from '../../../utils/cn.js';

/** Step 4: describe the problem and how urgent it is. */
export default function DetailsStep({ value, onChange }) {
  const set = (patch) => onChange({ ...value, ...patch });
  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 text-sm font-medium">How urgent is it?</p>
        <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Emergency level">
          {EMERGENCY_LEVELS.map((l) => (
            <button key={l.value} type="button" role="radio" aria-checked={value.emergencyLevel === l.value} onClick={() => set({ emergencyLevel: l.value })}
              className={cn('rounded-xl border p-3 text-left', value.emergencyLevel === l.value ? 'border-ink-900 bg-brand-50 ring-2 ring-brand-400' : 'border-ink-200 bg-white')}
            >
              <p className="font-semibold">{l.label}</p><p className="text-sm text-ink-600">{l.hint}</p>
            </button>
          ))}
        </div>
      </div>
      <Input label="What is the issue?" placeholder="e.g. Engine will not start" maxLength={200} value={value.issue} onChange={(e) => set({ issue: e.target.value })} />
      <Textarea label="More details (optional)" rows={4} maxLength={1000} placeholder="Anything the partner should know: warning lights, noises, safe parking spot..." value={value.description} onChange={(e) => set({ description: e.target.value })} />
      <div>
        <label htmlFor="photo" className="mb-1.5 flex items-center gap-2 text-sm font-medium"><ImagePlus size={16} aria-hidden /> Photo</label>
        <input id="photo" type="file" accept="image/*" disabled className="block w-full cursor-not-allowed rounded-xl border border-dashed border-ink-200 bg-ink-50 px-3.5 py-3 text-sm text-ink-400" />
        <p className="mt-1.5 text-sm text-ink-500">Photo upload is not available yet.</p>
      </div>
    </div>
  );
}
