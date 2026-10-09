import { useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { Button, Card, EmptyState, ErrorState, LoadingState, PageHeader, Pagination } from '../../components/ui/index.js';
import { useRealtime } from '../../context/RealtimeContext.jsx';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useFetch } from '../../hooks/useFetch.js';
import { notificationService } from '../../services/feedback.js';
import { cn } from '../../utils/cn.js';
import { timeAgo } from '../../utils/format.js';

export default function Notifications() {
  useDocumentTitle('Notifications');
  const { setUnread, tick } = useRealtime();
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch(() => notificationService.list({ page, limit: 15 }), [page, tick]);

  const markAll = async () => { await notificationService.markAllRead(); setUnread(0); reload({ silent: true }); };
  const markOne = async (n) => {
    if (n.isRead) return;
    await notificationService.markRead(n._id);
    setUnread((c) => Math.max(0, c - 1));
    reload({ silent: true });
  };

  return (
    <>
      <PageHeader title="Notifications" actions={data?.unread > 0 && <Button variant="secondary" icon={CheckCheck} onClick={markAll}>Mark all read</Button>} />
      {loading && !data ? <LoadingState variant="list" count={4} />
        : error && !data ? <ErrorState message={error} onRetry={reload} />
          : data.notifications.length === 0 ? <EmptyState icon={Bell} title="No notifications yet" description="Updates about your requests will appear here." />
            : (
              <>
                <ul className="space-y-2">
                  {data.notifications.map((n) => (
                    <li key={n._id}>
                      <Card as="button" type="button" onClick={() => markOne(n)} className={cn('w-full text-left', !n.isRead && 'border-brand-300 bg-brand-50/60')}>
                        <div className="flex items-start justify-between gap-3">
                          <div><p className="font-semibold">{n.title}</p>{n.message && <p className="text-ink-600">{n.message}</p>}</div>
                          <span className="shrink-0 text-xs text-ink-500">{timeAgo(n.createdAt)}</span>
                        </div>
                      </Card>
                    </li>
                  ))}
                </ul>
                <Pagination page={data.page} pages={data.pages} onChange={setPage} />
              </>
            )}
    </>
  );
}
