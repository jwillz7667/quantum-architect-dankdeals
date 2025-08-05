import {
  List,
  Datagrid,
  TextField,
  DateField,
  EditButton,
  DeleteButton,
  CreateButton,
  TopToolbar,
} from 'react-admin';

const CategoryListActions = () => (
  <TopToolbar>
    <CreateButton />
  </TopToolbar>
);

export const CategoryList = () => (
  <List actions={<CategoryListActions />} sort={{ field: 'name', order: 'ASC' }} perPage={25}>
    <Datagrid rowClick="edit">
      <TextField source="name" />
      <TextField source="slug" />
      <TextField source="description" />
      <DateField source="created_at" showTime />
      <EditButton />
      <DeleteButton mutationMode="pessimistic" />
    </Datagrid>
  </List>
);
