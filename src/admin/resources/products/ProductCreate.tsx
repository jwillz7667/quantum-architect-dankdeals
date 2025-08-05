import {
  Create,
  SimpleForm,
  TextInput,
  NumberInput,
  ReferenceInput,
  SelectInput,
  ImageInput,
  ImageField,
  required,
  number,
  minValue,
  maxValue,
  useNotify,
} from 'react-admin';
import { Box, Typography } from '@mui/material';
import { RichTextInput } from 'ra-input-rich-text';
import { uploadProductImage } from '../../utils/imageUpload';

export const ProductCreate = () => {
  const notify = useNotify();

  interface ProductFormData {
    image_upload?: { rawFile?: File };
    image_url?: string;
    [key: string]: unknown;
  }

  const transformData = async (data: ProductFormData) => {
    try {
      // Handle image upload if a file was selected
      if (data.image_upload && data.image_upload.rawFile) {
        const imageUrl = await uploadProductImage({
          file: data.image_upload.rawFile,
        });
        data.image_url = imageUrl;
      }

      // Remove the upload field from the data
      delete data.image_upload;

      return data;
    } catch (error) {
      notify('Failed to upload image', { type: 'error' });
      throw error;
    }
  };

  return (
    <Create redirect="show" transform={transformData}>
      <SimpleForm>
        <Box display="flex" gap={2} width="100%">
          <Box flex={1}>
            <Typography variant="h6" gutterBottom>
              Product Information
            </Typography>

            <TextInput source="name" validate={[required()]} fullWidth />

            <ReferenceInput
              source="category_id"
              reference="categories"
              sort={{ field: 'name', order: 'ASC' }}
            >
              <SelectInput optionText="name" validate={[required()]} fullWidth />
            </ReferenceInput>

            <RichTextInput source="description" fullWidth />

            <Box display="flex" gap={2}>
              <NumberInput
                source="price"
                validate={[required(), number(), minValue(0)]}
                defaultValue={0}
              />

              <NumberInput
                source="quantity"
                validate={[required(), number(), minValue(0)]}
                defaultValue={0}
                label="Stock Quantity"
              />
            </Box>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Cannabis Information
            </Typography>

            <NumberInput
              source="thc_content"
              validate={[number(), minValue(0), maxValue(100)]}
              defaultValue={0}
              label="THC Content (%)"
            />

            <NumberInput
              source="cbd_content"
              validate={[number(), minValue(0), maxValue(100)]}
              defaultValue={0}
              label="CBD Content (%)"
            />

            <TextInput source="strain" fullWidth />
          </Box>

          <Box flex={1}>
            <Typography variant="h6" gutterBottom>
              Product Image
            </Typography>

            <ImageInput
              source="image_upload"
              label="Upload Image"
              accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }}
              maxSize={5000000}
            >
              <ImageField source="src" title="title" />
            </ImageInput>

            <TextInput
              source="image_url"
              label="Or enter image URL"
              fullWidth
              helperText="If you upload an image, it will override this URL"
            />
          </Box>
        </Box>
      </SimpleForm>
    </Create>
  );
};
