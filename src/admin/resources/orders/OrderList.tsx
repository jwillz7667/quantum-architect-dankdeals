import {
  List,
  Datagrid,
  TextField,
  NumberField,
  DateField,
  ReferenceField,
  FilterButton,
  TopToolbar,
  SelectInput,
  DateInput,
  ShowButton,
} from 'react-admin';
import { Chip } from '@mui/material';

const OrderFilters = [
  <SelectInput
    source="status"
    choices={[
      { id: 'pending', name: 'Pending' },
      { id: 'processing', name: 'Processing' },
      { id: 'completed', name: 'Completed' },
      { id: 'cancelled', name: 'Cancelled' },
    ]}
    emptyText="All Statuses"
  />,
  <DateInput source="created_at_gte" label="Created After" />,
  <DateInput source="created_at_lte" label="Created Before" />,
];

const OrderListActions = () => (
  <TopToolbar>
    <FilterButton />
  </TopToolbar>
);

const StatusField = ({ record }: { record?: { status?: string } }) => {
  const statusColors: Record<string, 'default' | 'primary' | 'success' | 'error' | 'warning'> = {
    pending: 'warning',
    processing: 'primary',
    completed: 'success',
    cancelled: 'error',
  };

  const status = record?.status || 'pending';
  return <Chip label={status} color={statusColors[status] || 'default'} size="small" />;
};

export const OrderList = () => (
  <List
    filters={OrderFilters}
    actions={<OrderListActions />}
    sort={{ field: 'created_at', order: 'DESC' }}
    perPage={25}
  >
    <Datagrid rowClick="show">
      <TextField source="order_number" label="Order #" />
      <ReferenceField source="user_id" reference="profiles">
        <TextField source="full_name" />
      </ReferenceField>
      <DateField source="created_at" showTime />
      <StatusField label="Status" />
      <NumberField
        source="total"
        options={{
          style: 'currency',
          currency: 'USD',
        }}
      />
      <TextField source="customer_name" />
      <TextField source="customer_email" />
      <ShowButton />
    </Datagrid>
  </List>
);
