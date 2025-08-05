import {
  Show,
  SimpleShowLayout,
  TextField,
  NumberField,
  DateField,
  ReferenceField,
  ArrayField,
  Datagrid,
  useRecordContext,
} from 'react-admin';
import { Box, Typography, Chip, Card, CardContent } from '@mui/material';

const OrderTitle = () => {
  const record = useRecordContext<{ order_number?: string }>();
  return <span>Order #{record?.order_number}</span>;
};

const StatusField = () => {
  const record = useRecordContext<{ status?: string }>();
  const statusColors: Record<string, 'default' | 'primary' | 'success' | 'error' | 'warning'> = {
    pending: 'warning',
    processing: 'primary',
    completed: 'success',
    cancelled: 'error',
  };

  const status = record?.status || 'pending';
  return <Chip label={status} color={statusColors[status] || 'default'} />;
};

export const OrderShow = () => (
  <Show title={<OrderTitle />}>
    <SimpleShowLayout>
      <Box display="flex" gap={4}>
        <Box flex={1}>
          <Typography variant="h6" gutterBottom>
            Order Information
          </Typography>

          <TextField source="order_number" label="Order Number" />
          <StatusField />
          <DateField source="created_at" showTime />

          <NumberField
            source="subtotal"
            options={{
              style: 'currency',
              currency: 'USD',
            }}
          />

          <NumberField
            source="tax"
            options={{
              style: 'currency',
              currency: 'USD',
            }}
          />

          <NumberField
            source="total"
            options={{
              style: 'currency',
              currency: 'USD',
            }}
            sx={{ fontWeight: 'bold' }}
          />
        </Box>

        <Box flex={1}>
          <Typography variant="h6" gutterBottom>
            Customer Information
          </Typography>

          <TextField source="customer_name" />
          <TextField source="customer_email" />
          <TextField source="customer_phone" />

          <ReferenceField source="user_id" reference="profiles">
            <TextField source="full_name" label="Registered User" />
          </ReferenceField>
        </Box>
      </Box>

      <Box mt={4}>
        <Typography variant="h6" gutterBottom>
          Order Items
        </Typography>

        <ArrayField source="order_items">
          <Datagrid bulkActionButtons={false}>
            <ReferenceField source="product_id" reference="products">
              <TextField source="name" />
            </ReferenceField>
            <NumberField source="quantity" />
            <NumberField
              source="price"
              options={{
                style: 'currency',
                currency: 'USD',
              }}
            />
            <NumberField
              source="subtotal"
              options={{
                style: 'currency',
                currency: 'USD',
              }}
              label="Total"
            />
          </Datagrid>
        </ArrayField>
      </Box>

      <Box mt={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Special Instructions
            </Typography>
            <TextField source="notes" />
          </CardContent>
        </Card>
      </Box>
    </SimpleShowLayout>
  </Show>
);
