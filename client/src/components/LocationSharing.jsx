import { useCallback, useEffect, useRef, useState } from 'react';
import { FlaskConical, Radio, Square } from 'lucide-react';
import { Badge, Button, Card } from './ui/index.js';
import { useRealtime } from '../context/RealtimeContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useSocketEvent } from '../hooks/useSocketEvent.js';
import { emitAck } from '../services/socket.js';
import { watchPosition } from '../services/location.js';

const SEND_EVERY_MS = 3000;

/**
 * How the customer sees the mechanic move.
 *  - Live GPS: the browser's real position, streamed over Socket.IO (production behaviour).
 *  - Demo Tracking Mode: a server-side simulation of a drive to the customer, clearly labelled as a demo.
 */
export default function LocationSharing({ requestId, onPosition }) {
  const { socket } = useRealtime();
  const toast = useToast();
  const [mode, setMode] = useState('off');
  const [error, setError] = useState(null);
  const stopWatch = useRef(null);
  const lastSent = useRef(0);

  const stopGps = useCallback(() => { stopWatch.current?.(); stopWatch.current = null; }, []);
  useEffect(() => stopGps, [stopGps]);
  useSocketEvent('demo-tracking-stopped', (p) => { if (String(p.requestId) === String(requestId)) setMode((m) => (m === 'demo' ? 'off' : m)); });

  const startGps = () => {
    setError(null);
    stopGps();
    stopWatch.current = watchPosition(
      (pos) => {
        onPosition?.(pos);
        if (Date.now() - lastSent.current < SEND_EVERY_MS) return;
        lastSent.current = Date.now();
        socket?.emit('location-update', { requestId, ...pos });
      },
      (e) => { setError(`${e.message} Use Demo Tracking Mode instead.`); setMode('off'); stopGps(); },
    );
    setMode('gps');
  };

  const startDemo = async () => {
    setError(null);
    stopGps();
    try {
      await emitAck(socket, 'demo-tracking-start', { requestId, autoComplete: false });
      setMode('demo');
      toast.info('Demo Tracking Mode started');
    } catch (e) {
      setError(e.message);
    }
  };

  const stop = async () => {
    stopGps();
    if (mode === 'demo') await emitAck(socket, 'demo-tracking-stop', { requestId }).catch(() => {});
    setMode('off');
  };

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-display text-2xl font-semibold">Share my location</h3>
        {mode === 'gps' && <Badge tone="success" icon={Radio}>Live GPS on</Badge>}
        {mode === 'demo' && <Badge tone="warning" icon={FlaskConical}>Demo Tracking Mode</Badge>}
      </div>
      <p className="mb-4 text-sm text-ink-600">Customers see your position update live. Use your phone's GPS on the road, or run the demo simulation when presenting.</p>
      {error && <p role="alert" className="mb-3 rounded-xl bg-stop-50 px-4 py-3 text-sm text-stop-700">{error}</p>}
      <div className="grid gap-2 sm:grid-cols-2">
        {mode === 'off' ? (
          <>
            <Button icon={Radio} onClick={startGps}>Start live GPS</Button>
            <Button variant="secondary" icon={FlaskConical} onClick={startDemo}>Run Demo Tracking Mode</Button>
          </>
        ) : (
          <Button variant="danger" icon={Square} onClick={stop} className="sm:col-span-2">Stop sharing</Button>
        )}
      </div>
    </Card>
  );
}
