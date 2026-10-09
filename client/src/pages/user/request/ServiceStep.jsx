import ServiceCard from '../../../components/ServiceCard.jsx';

/** Step 2: choose the service. */
export default function ServiceStep({ services, value, onChange }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {services.map((s) => <ServiceCard key={s._id} service={s} selected={value === s.code} onSelect={(x) => onChange(x.code)} actionLabel="Choose" />)}
    </div>
  );
}
