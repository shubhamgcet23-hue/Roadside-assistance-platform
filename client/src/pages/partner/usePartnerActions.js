import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { getErrorMessage } from '../../services/api.js';
import { requestService } from '../../services/requests.js';

/** Accept / reject handlers shared by the partner dashboard and requests page. */
export function usePartnerActions(onChanged) {
  const toast = useToast();
  const navigate = useNavigate();
  const { refresh } = useAuth();

  const accept = async (request) => {
    try {
      await requestService.accept(request._id);
      toast.success('Request accepted. Head to the customer.');
      await refresh().catch(() => {});
      navigate('/partner/active');
    } catch (e) {
      toast.error(getErrorMessage(e, 'Could not accept this request.'));
      onChanged?.();
    }
  };
  const reject = async (request) => {
    try { await requestService.reject(request._id); toast.info('Request rejected'); } catch (e) { toast.error(getErrorMessage(e)); }
    onChanged?.();
  };
  return { accept, reject };
}
