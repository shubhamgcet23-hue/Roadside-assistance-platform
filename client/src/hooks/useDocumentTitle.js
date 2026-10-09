import { useEffect } from 'react';

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | RoadsideAAA` : 'RoadsideAAA | Fast Help. Right Where You Are.';
  }, [title]);
}
