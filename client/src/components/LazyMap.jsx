import { Suspense, lazy } from 'react';
import { Skeleton } from './ui/index.js';
import { cn } from '../utils/cn.js';

const MapView = lazy(() => import('./MapView.jsx'));

/** Code-split map with a skeleton while Leaflet loads. */
export default function LazyMap(props) {
  return (
    <Suspense fallback={<Skeleton className={cn('h-72 w-full', props.className)} />}>
      <MapView {...props} />
    </Suspense>
  );
}
