import { Loader2 } from 'lucide-react';

export default function GlobalLoading() {
  return (
    <div className="shell" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <Loader2 size={40} color="var(--accent-primary)" className="animate-spin" />
    </div>
  );
}
