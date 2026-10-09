import LocationPicker from '../../../components/LocationPicker.jsx';

/** Step 3: where is the vehicle? GPS, search, map pin or manual address. */
export default function LocationStep({ value, onChange }) {
  return <LocationPicker value={value} onChange={onChange} />;
}
