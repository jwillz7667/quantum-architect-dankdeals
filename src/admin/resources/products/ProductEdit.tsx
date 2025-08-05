import {
  Edit,
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
  DeleteButton,
  SaveButton,
  Toolbar,
  useRecordContext,
  useNotify,
} from 'react-admin';
import { Box, Typography } from '@mui/material';
import { RichTextInput } from 'ra-input-rich-text';
import { uploadProductImage, deleteProductImage } from '../../utils/imageUpload';

const ProductEditToolbar = () => (
  <Toolbar>
    <SaveButton />
    <DeleteButton mutationMode="pessimistic" />
  </Toolbar>
);

const ProductTitle = () => {
  const record = useRecordContext<{ name?: string }>();
  return <span>Product: {record?.name || ''}</span>;
};

export const ProductEdit = () => {
  const notify = useNotify();

  interface ProductFormData {
    image_upload?: { rawFile?: File };
    image_url?: string;
    [key: string]: unknown;
  }

  const transformData = async (data: ProductFormData) => {
    try {
      // Handle image upload if a new file was selected
      if (data.image_upload && data.image_upload.rawFile) {
        const imageUrl = await uploadProductImage({
          file: data.image_upload.rawFile,
        });

        // Delete old image if exists
        if (data.image_url) {
          await deleteProductImage(data.image_url);
        }

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
    <Edit title={<ProductTitle />} mutationMode="pessimistic" transform={transformData}>
      <SimpleForm toolbar={<ProductEditToolbar />}>
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
                format={(v: number) => v || 0}
              />

              <NumberInput
                source="quantity"
                validate={[required(), number(), minValue(0)]}
                format={(v: number) => v || 0}
                label="Stock Quantity"
              />
            </Box>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Cannabis Information
            </Typography>

            <NumberInput
              source="thc_content"
              validate={[number(), minValue(0), maxValue(100)]}
              format={(v: number) => v || 0}
              label="THC Content (%)"
            />

            <NumberInput
              source="cbd_content"
              validate={[number(), minValue(0), maxValue(100)]}
              format={(v: number) => v || 0}
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

            <Box mt={2}>
              {/* Preview current image */}
              <Typography variant="body2" gutterBottom>
                Current Image:
              </Typography>
              <ImageField source="image_url" sx={{ maxWidth: 300 }} />
            </Box>
          </Box>
        </Box>
      </SimpleForm>
    </Edit>
  );
};
