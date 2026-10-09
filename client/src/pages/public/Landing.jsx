import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, ChevronDown, Clock, MapPin, Radar, Search, ShieldCheck, Star, Tag, Wrench } from 'lucide-react';
import { Button, Card } from '../../components/ui/index.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { SERVICE_CODES } from '../../types/constants.js';
import { serviceIcon, serviceLabel } from '../../utils/icons.js';

const STEPS = [
  { icon: Wrench, title: 'Request help', text: 'Pick your vehicle and the problem. Share your location in one tap.' },
  { icon: Search, title: 'Find a nearby partner', text: 'See verified mechanics and tow trucks with distance, ETA and price.' },
  { icon: Radar, title: 'Track assistance', text: 'Watch your partner approach on the map with live status updates.' },
  { icon: MapPin, title: 'Get back on the road', text: 'Pay at service. Rate your partner and keep a service summary.' },
];
const SERVICE_BLURB = {
  BREAKDOWN_REPAIR: 'On-the-spot repair by a mechanic.',
  TOWING: 'A tow truck to the garage of your choice.',
  BATTERY_JUMPSTART: 'Dead battery? Back running in minutes.',
  FLAT_TIRE: 'Tire change or puncture repair.',
  FUEL_DELIVERY: 'Ran dry? Fuel brought to you.',
};
const WHY = [
  { icon: ShieldCheck, title: 'Verified partners', text: 'Every partner is reviewed by our team before receiving requests.' },
  { icon: Clock, title: 'Fast response', text: 'Requests go to the closest available partners instantly.' },
  { icon: Tag, title: 'Transparent pricing', text: 'Base cost plus distance, shown before you confirm.' },
  { icon: Radar, title: 'Real-time tracking', text: 'Follow your partner live and see status changes as they happen.' },
];
// Demo content for the academic presentation, not real customer reviews.
const TESTIMONIALS = [
  { name: 'Demo customer A', text: 'Car stalled on the highway at night. A mechanic reached me in under 20 minutes.', rating: 5 },
  { name: 'Demo customer B', text: 'Seeing the price before confirming made it stress-free.', rating: 5 },
  { name: 'Demo customer C', text: 'Tracking the tow truck on the map was reassuring.', rating: 4 },
];
const FAQ = [
  { q: 'How much does it cost?', a: 'You see an estimate (base service cost plus a distance charge) before you confirm. The final price may vary with the work required.' },
  { q: 'How do I pay?', a: 'Payment is made directly to the partner at service. Online payments are planned for a later phase.' },
  { q: 'Are the partners verified?', a: 'Yes. Only partners approved by an administrator can receive requests.' },
  { q: 'What if no partner accepts?', a: 'Requests expire after a few minutes if nobody accepts, and you can try again immediately.' },
  { q: 'Can I become a partner?', a: 'Sign up as a mechanic or towing partner, complete your profile, and wait for verification.' },
];

function Faq({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-ink-200">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-4 py-4 text-left font-semibold">
        {q}<ChevronDown size={20} className={open ? 'rotate-180 transition-transform' : 'transition-transform'} aria-hidden />
      </button>
      {open && <p className="pb-4 text-ink-600">{a}</p>}
    </div>
  );
}

export default function Landing() {
  useDocumentTitle();
  return (
    <main id="main">
      <section className="on-dark relative overflow-hidden bg-ink-950 pb-20 pt-32 text-white sm:pt-40">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-brand-400"><BadgeCheck size={16} aria-hidden /> Verified partners only</p>
            <h1 className="font-display text-6xl font-bold leading-[0.95] sm:text-8xl">Vehicle trouble?<br /><span className="text-brand-400">Help is on the way.</span></h1>
            <p className="mt-6 max-w-xl text-lg text-ink-200">Connect with verified mechanics and roadside assistance partners near you.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button to="/register" size="xl">Get assistance</Button>
              <Button to="/register?role=MECHANIC" size="xl" variant="outlineLight">Become a partner</Button>
            </div>
          </div>
          <div aria-hidden className="relative mx-auto aspect-square w-full max-w-md rounded-3xl bg-ink-900 p-6 ring-1 ring-white/10">
            <div className="absolute inset-6 rounded-2xl bg-[radial-gradient(circle_at_50%_50%,#232c35_0,#161c22_70%)]" />
            <div className="absolute left-[18%] top-[22%] grid h-12 w-12 place-items-center rounded-full bg-brand-400 text-ink-950 shadow-lift"><Wrench size={22} /></div>
            <div className="absolute right-[20%] top-[40%] grid h-9 w-9 place-items-center rounded-full bg-white text-ink-950"><Wrench size={15} /></div>
            <div className="absolute bottom-[24%] left-[34%] h-7 w-7 rounded-full border-4 border-white bg-ink-950 ring-8 ring-brand-400/30" />
            <div className="lane-dash absolute inset-x-10 bottom-10" />
            <p className="absolute bottom-14 right-10 rounded-lg bg-brand-400 px-3 py-1.5 font-display text-xl font-bold text-ink-950">ETA 12 min</p>
          </div>
        </div>
        <div className="hazard absolute inset-x-0 bottom-0 h-2" aria-hidden />
      </section>

      <section id="how" className="mx-auto max-w-6xl scroll-mt-8 px-4 py-20 sm:px-6">
        <h2 className="font-display text-5xl font-semibold">How it works</h2>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <Card className="h-full">
                <p className="font-display text-5xl font-bold text-brand-500">{i + 1}</p>
                <s.icon className="mt-3 text-ink-900" aria-hidden />
                <h3 className="mt-3 text-2xl font-semibold">{s.title}</h3>
                <p className="mt-1 text-ink-600">{s.text}</p>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section id="services" className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="font-display text-5xl font-semibold">Services</h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {SERVICE_CODES.map((code) => {
              const Icon = serviceIcon(code);
              return (
                <li key={code} className="rounded-2xl border border-ink-100 bg-ink-50 p-5">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-ink-900 text-brand-400"><Icon size={24} aria-hidden /></span>
                  <h3 className="mt-3 text-2xl font-semibold leading-tight">{serviceLabel(code)}</h3>
                  <p className="mt-1 text-sm text-ink-600">{SERVICE_BLURB[code]}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section id="why" className="mx-auto max-w-6xl scroll-mt-8 px-4 py-20 sm:px-6">
        <h2 className="font-display text-5xl font-semibold">Why RoadsideAAA?</h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {WHY.map((w) => (
            <li key={w.title} className="flex gap-4 rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-400 text-ink-950"><w.icon size={22} aria-hidden /></span>
              <div><h3 className="text-2xl font-semibold">{w.title}</h3><p className="text-ink-600">{w.text}</p></div>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-ink-900 py-20 text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="font-display text-5xl font-semibold">What drivers say</h2>
          <p className="mt-1 text-sm text-ink-300">Demo testimonials for presentation purposes.</p>
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <li key={t.name} className="rounded-2xl bg-white/5 p-5">
                <div className="flex gap-0.5" role="img" aria-label={`${t.rating} out of 5 stars`}>{Array.from({ length: t.rating }, (_, i) => <Star key={i} size={16} className="fill-brand-400 text-brand-400" aria-hidden />)}</div>
                <p className="mt-3">&ldquo;{t.text}&rdquo;</p>
                <p className="mt-3 text-sm text-ink-300">{t.name}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-3xl scroll-mt-8 px-4 py-20 sm:px-6">
        <h2 className="font-display text-5xl font-semibold">Questions</h2>
        <div className="mt-6 border-t border-ink-200">{FAQ.map((f) => <Faq key={f.q} {...f} />)}</div>
        <div className="mt-10 text-center"><Button to="/register" size="lg">Get assistance</Button> <Link to="/login" className="ml-3 font-semibold underline">Log in</Link></div>
      </section>
    </main>
  );
}
