import {
  Show,
  SimpleShowLayout,
  TextField,
  NumberField,
  DateField,
  ReferenceField,
  RichTextField,
  ImageField,
  EditButton,
  DeleteButton,
  TopToolbar,
  useRecordContext,
} from 'react-admin';
import { Box, Typography, Chip } from '@mui/material';

const ProductShowActions = () => (
  <TopToolbar>
    <EditButton />
    <DeleteButton mutationMode="pessimistic" />
  </TopToolbar>
);

const ProductTitle = () => {
  const record = useRecordContext<{ name?: string }>();
  return <span>{record?.name || ''}</span>;
};

const StockStatus = () => {
  const record = useRecordContext<{ quantity?: number }>();
  const inStock = (record?.quantity || 0) > 0;

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Typography variant="body2">Stock Status:</Typography>
      <Chip
        label={inStock ? 'In Stock' : 'Out of Stock'}
        color={inStock ? 'success' : 'error'}
        size="small"
      />
      <Typography variant="body2">({record?.quantity || 0} units)</Typography>
    </Box>
  );
};

export const ProductShow = () => (
  <Show title={<ProductTitle />} actions={<ProductShowActions />}>
    <SimpleShowLayout>
      <Box display="flex" gap={4}>
        <Box flex={1}>
          <Typography variant="h6" gutterBottom>
            Product Information
          </Typography>

          <TextField source="name" />

          <ReferenceField source="category_id" reference="categories">
            <TextField source="name" />
          </ReferenceField>

          <NumberField
            source="price"
            options={{
              style: 'currency',
              currency: 'USD',
            }}
          />

          <StockStatus />

          <RichTextField source="description" />

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Cannabis Information
          </Typography>

          <Box display="flex" gap={2}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                THC Content
              </Typography>
              <Typography variant="body1">
                <NumberField source="thc_content" />%
              </Typography>
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">
                CBD Content
              </Typography>
              <Typography variant="body1">
                <NumberField source="cbd_content" />%
              </Typography>
            </Box>
          </Box>

          <TextField source="strain" />

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Metadata
          </Typography>

          <DateField source="created_at" showTime />
          <DateField source="updated_at" showTime />
        </Box>

        <Box flex={1}>
          <Typography variant="h6" gutterBottom>
            Product Image
          </Typography>

          <ImageField
            source="image_url"
            sx={{
              '& img': {
                maxWidth: '100%',
                height: 'auto',
                borderRadius: 2,
              },
            }}
          />
        </Box>
      </Box>
    </SimpleShowLayout>
  </Show>
);
