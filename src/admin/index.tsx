import { Admin, Resource } from 'react-admin';
import { supabaseDataProvider } from 'ra-supabase';
import { supabaseAuthProvider } from './authProvider';
import { supabase } from '@/integrations/supabase/client';
import { ProductList, ProductEdit, ProductCreate, ProductShow } from './resources/products';
import { CategoryList, CategoryEdit, CategoryCreate } from './resources/categories';
import { OrderList, OrderShow } from './resources/orders';
import { Dashboard } from './Dashboard';
import { AdminLayout } from './AdminLayout';
import { adminTheme } from './theme';
import { Package, Tag, ShoppingCart, Users } from 'lucide-react';

// Configure data provider
const dataProvider = supabaseDataProvider(supabase);

// Configure auth provider
const authProvider = supabaseAuthProvider(supabase);

// Custom layout to integrate with our theme
const layout = () => <AdminLayout />;

function AdminApp() {
  return (
    <Admin
      dataProvider={dataProvider}
      authProvider={authProvider}
      layout={layout}
      dashboard={Dashboard}
      title="Dank Deals Admin"
      theme={adminTheme}
      disableTelemetry
    >
      <Resource
        name="products"
        list={ProductList}
        edit={ProductEdit}
        create={ProductCreate}
        show={ProductShow}
        icon={Package}
        recordRepresentation="name"
      />
      <Resource
        name="categories"
        list={CategoryList}
        edit={CategoryEdit}
        create={CategoryCreate}
        icon={Tag}
        recordRepresentation="name"
      />
      <Resource
        name="orders"
        list={OrderList}
        show={OrderShow}
        icon={ShoppingCart}
        options={{ label: 'Orders' }}
      />
      <Resource name="profiles" icon={Users} options={{ label: 'Users' }} />
    </Admin>
  );
}

export default AdminApp;
