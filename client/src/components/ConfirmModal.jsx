import { Button, Modal } from './ui/index.js';

export default function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false, loading = false, children }) {
  return (
    <Modal
      open={open} onClose={onClose} title={title} size="sm"
      footer={(
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Back</Button>
          <Button variant={danger ? 'danger' : 'dark'} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </>
      )}
    >
      {message && <p className="text-ink-700">{message}</p>}
      {children}
    </Modal>
  );
}
