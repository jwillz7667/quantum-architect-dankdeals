import {
  Edit,
  SimpleForm,
  TextInput,
  required,
  Toolbar,
  SaveButton,
  DeleteButton,
} from 'react-admin';

const CategoryEditToolbar = () => (
  <Toolbar>
    <SaveButton />
    <DeleteButton mutationMode="pessimistic" />
  </Toolbar>
);

export const CategoryEdit = () => (
  <Edit mutationMode="pessimistic">
    <SimpleForm toolbar={<CategoryEditToolbar />}>
      <TextInput source="name" validate={[required()]} fullWidth />
      <TextInput source="slug" validate={[required()]} fullWidth />
      <TextInput source="description" multiline rows={3} fullWidth />
    </SimpleForm>
  </Edit>
);
