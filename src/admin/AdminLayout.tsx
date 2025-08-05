import { Layout } from 'react-admin';
import type { LayoutProps } from 'react-admin';
import { AdminAppBar } from './AdminAppBar';

export const AdminLayout = (props: LayoutProps) => <Layout {...props} appBar={AdminAppBar} />;
