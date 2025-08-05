import { Create, SimpleForm, TextInput, required } from 'react-admin';

export const CategoryCreate = () => (
  <Create redirect="list">
    <SimpleForm>
      <TextInput source="name" validate={[required()]} fullWidth />
      <TextInput
        source="slug"
        validate={[required()]}
        fullWidth
        helperText="URL-friendly version of the name (e.g., 'flower-products')"
      />
      <TextInput source="description" multiline rows={3} fullWidth />
    </SimpleForm>
  </Create>
);
