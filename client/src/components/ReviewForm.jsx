import { useState } from 'react';
import { Button, StarRating, Textarea } from './ui/index.js';
import { reviewService } from '../services/feedback.js';
import { getErrorMessage } from '../services/api.js';
import { useToast } from '../context/ToastContext.jsx';

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

/** 1-5 star rating plus optional review. The server rejects a second review for the same request. */
export default function ReviewForm({ requestId, partnerName, onDone }) {
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!rating) { toast.error('Please choose a star rating.'); return; }
    setBusy(true);
    try {
      await reviewService.create({ requestId, rating, comment: comment.trim() || undefined });
      toast.success('Thanks for your feedback!');
      onDone?.();
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not submit your review.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="font-medium">How was {partnerName || 'your partner'}?</p>
      <div className="flex items-center gap-3">
        <StarRating value={rating} onChange={setRating} size={32} />
        <span className="text-sm font-semibold text-ink-600" aria-live="polite">{LABELS[rating]}</span>
      </div>
      <Textarea aria-label="Write a review" placeholder="Tell us what went well (optional)" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} />
      <Button onClick={submit} loading={busy} disabled={!rating}>Submit review</Button>
    </div>
  );
}
