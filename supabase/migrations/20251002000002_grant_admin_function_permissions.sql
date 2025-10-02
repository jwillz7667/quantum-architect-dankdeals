-- Grant permissions for admin RPC functions
-- This fixes 404 errors when calling admin functions from frontend

-- Grant execute permission on admin_upsert_product to authenticated users
-- The function itself checks for admin role via ensure_admin_access()
GRANT EXECUTE ON FUNCTION public.admin_upsert_product(jsonb, jsonb, boolean)
TO authenticated, service_role;

-- Grant execute permission on admin_delete_product to authenticated users
GRANT EXECUTE ON FUNCTION public.admin_delete_product(uuid, boolean)
TO authenticated, service_role;

-- Grant execute permission on ensure_admin_access to authenticated users
GRANT EXECUTE ON FUNCTION public.ensure_admin_access()
TO authenticated, service_role;

-- Verify grants were applied
COMMENT ON FUNCTION public.admin_upsert_product(jsonb, jsonb, boolean) IS
'Creates or updates a product along with its variants. Requires administrator permissions. Callable by authenticated users (admin check performed inside).';

COMMENT ON FUNCTION public.admin_delete_product(uuid, boolean) IS
'Soft deletes a product by default or performs a hard delete when explicitly requested. Requires administrator permissions.';
