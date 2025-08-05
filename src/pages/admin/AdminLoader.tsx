import { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

// Lazy load the admin panel with prefetch hint
const AdminPanel = lazy(
  () => import(/* webpackChunkName: "admin", webpackPrefetch: true */ '@/admin')
);

function AdminLoader() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <AdminPanel />
    </Suspense>
  );
}

export default AdminLoader;
