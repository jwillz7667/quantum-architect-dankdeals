import {
  List,
  Datagrid,
  TextField,
  NumberField,
  DateField,
  EditButton,
  DeleteButton,
  FilterButton,
  SelectInput,
  SearchInput,
  TopToolbar,
  CreateButton,
  ExportButton,
} from 'react-admin';
import { Box, Chip } from '@mui/material';

const ProductFilters = [
  <SearchInput source="q" alwaysOn />,
  <SelectInput
    source="category_id"
    choices={[{ id: '', name: 'All Categories' }]}
    emptyText="All Categories"
  />,
  <SelectInput
    source="in_stock"
    choices={[
      { id: 'true', name: 'In Stock' },
      { id: 'false', name: 'Out of Stock' },
    ]}
    emptyText="All"
  />,
];

const ProductListActions = () => (
  <TopToolbar>
    <FilterButton />
    <CreateButton />
    <ExportButton />
  </TopToolbar>
);

const ProductImage = ({ record }: { record?: { image_url?: string; name?: string } }) => {
  if (!record?.image_url) return null;
  return (
    <Box
      component="img"
      src={record.image_url}
      alt={record.name}
      sx={{
        width: 50,
        height: 50,
        objectFit: 'cover',
        borderRadius: 1,
      }}
    />
  );
};

const StockField = ({ record }: { record?: { quantity?: number } }) => {
  const inStock = record?.quantity > 0;
  return (
    <Chip
      label={inStock ? 'In Stock' : 'Out of Stock'}
      color={inStock ? 'success' : 'error'}
      size="small"
    />
  );
};

export const ProductList = () => (
  <List
    filters={ProductFilters}
    actions={<ProductListActions />}
    sort={{ field: 'created_at', order: 'DESC' }}
    perPage={25}
  >
    <Datagrid
      rowClick="show"
      sx={{
        '& .RaDatagrid-headerCell': {
          fontWeight: 'bold',
        },
      }}
    >
      <ProductImage label="Image" />
      <TextField source="name" />
      <TextField source="category.name" label="Category" />
      <NumberField
        source="price"
        options={{
          style: 'currency',
          currency: 'USD',
        }}
      />
      <NumberField source="quantity" label="Stock" />
      <StockField label="Status" />
      <DateField source="created_at" label="Created" showTime />
      <EditButton />
      <DeleteButton mutationMode="pessimistic" />
    </Datagrid>
  </List>
);
