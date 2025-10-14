import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ProductImageUpload from '@/components/admin/ProductImageUpload';
import { cn } from '@/lib/utils';
import type { AdminProduct, UpsertAdminProductInput } from '@/lib/admin/products';

const CATEGORY_OPTIONS = ['flower', 'edibles', 'concentrates', 'accessories'] as const;
const STRAIN_TYPES = ['indica', 'sativa', 'hybrid'] as const;

const parseNullableNumber = (value: unknown) => {
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseRequiredNumber = (value: unknown) => {
  const parsed = parseNullableNumber(value);
  return parsed ?? value;
};

const toNullableString = (value: unknown) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
};

const variantSchema = z.object({
  id: z.string().optional(), // TEXT in DB - supports custom IDs like "pv_productname_size"
  name: z.string().min(1, 'Variant name is required'),
  price: z.preprocess(parseRequiredNumber, z.number().nonnegative()),
  weight_grams: z.preprocess(parseNullableNumber, z.number().positive().nullable()).optional(),
  inventory_count: z
    .preprocess(parseNullableNumber, z.number().int().nonnegative().nullable())
    .optional(),
  is_active: z.boolean().default(true),
});

const adminProductFormSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Product name is required'),
  description: z.preprocess(toNullableString, z.string().nullable()).optional(),
  category: z.enum(CATEGORY_OPTIONS),
  price: z.preprocess(parseRequiredNumber, z.number().nonnegative()),
  image_url: z.preprocess(toNullableString, z.string().url().nullable()).optional(),
  gallery_input: z.string().optional(),
  thc_content: z.preprocess(parseNullableNumber, z.number().min(0).max(100).nullable()).optional(),
  cbd_content: z.preprocess(parseNullableNumber, z.number().min(0).max(100).nullable()).optional(),
  strain_type: z.preprocess(toNullableString, z.enum(STRAIN_TYPES).nullable()).optional(),
  effects_input: z.string().optional(),
  flavors_input: z.string().optional(),
  stock_quantity: z
    .preprocess(parseNullableNumber, z.number().int().nonnegative().nullable())
    .optional(),
  weight_grams: z.preprocess(parseNullableNumber, z.number().positive().nullable()).optional(),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  lab_tested: z.boolean().default(false),
  lab_results_url: z.preprocess(toNullableString, z.string().url().nullable()).optional(),
  variants: z.array(variantSchema).default([]),
});

export type AdminProductFormValues = z.infer<typeof adminProductFormSchema>;

interface AdminProductFormProps {
  initialProduct?: AdminProduct;
  onSubmit: (payload: UpsertAdminProductInput) => Promise<void> | void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
}

const buildDefaultVariant = (): AdminProductFormValues['variants'][number] => ({
  id: undefined,
  name: '',
  price: 0,
  weight_grams: null,
  inventory_count: null,
  is_active: true,
});

const mapProductToFormValues = (product?: AdminProduct): AdminProductFormValues => ({
  id: product?.id,
  name: product?.name ?? '',
  description: product?.description ?? null,
  category: (product?.category as AdminProductFormValues['category']) ?? 'flower',
  price: product?.price ?? 0,
  image_url: product?.image_url ?? null,
  gallery_input: (product?.gallery_urls ?? []).join('\n'),
  thc_content: product?.thc_content ?? null,
  cbd_content: product?.cbd_content ?? null,
  strain_type: (product?.strain_type as AdminProductFormValues['strain_type']) ?? null,
  effects_input: (product?.effects ?? []).join(', '),
  flavors_input: (product?.flavors ?? []).join(', '),
  stock_quantity: product?.stock_quantity ?? null,
  weight_grams: product?.weight_grams ?? null,
  is_active: product?.is_active ?? true,
  is_featured: product?.is_featured ?? false,
  lab_tested: product?.lab_tested ?? false,
  lab_results_url: product?.lab_results_url ?? null,
  variants: product?.variants?.length
    ? product.variants.map((variant) => ({
        id: variant.id,
        name: variant.name,
        price: variant.price,
        weight_grams: variant.weight_grams ?? null,
        inventory_count: variant.inventory_count ?? null,
        is_active: variant.is_active ?? true,
      }))
    : [buildDefaultVariant()],
});

const AdminProductForm = ({
  initialProduct,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Save product',
}: AdminProductFormProps) => {
  const [uploadedMainImage, setUploadedMainImage] = useState<string | null>(null);
  const [uploadedGalleryImages, setUploadedGalleryImages] = useState<string[]>([]);
  const [imageUploadMode, setImageUploadMode] = useState<'upload' | 'url'>('upload');

  const form = useForm<AdminProductFormValues>({
    resolver: zodResolver(adminProductFormSchema) as Resolver<AdminProductFormValues>,
    defaultValues: mapProductToFormValues(initialProduct),
    mode: 'onSubmit',
  });

  useEffect(() => {
    form.reset(mapProductToFormValues(initialProduct));
    // Initialize uploaded images from initial product
    if (initialProduct?.image_url) {
      setUploadedMainImage(initialProduct.image_url);
    }
    if (initialProduct?.gallery_urls?.length) {
      setUploadedGalleryImages(initialProduct.gallery_urls);
    }
  }, [initialProduct, form]);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = form;

  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
  } = useFieldArray<AdminProductFormValues>({
    control,
    name: 'variants',
  });

  const submitHandler = handleSubmit(async (values) => {
    const parseList = (input?: string) =>
      input
        ? input
            .split(/[\n,]+/)
            .map((entry) => entry.trim())
            .filter((entry) => entry.length > 0)
        : [];

    const effects = parseList(values.effects_input);
    const flavors = parseList(values.flavors_input);

    // Use uploaded images if in upload mode, otherwise parse from text input
    let imageUrl: string | null = null;
    let galleryUrls: string[] = [];

    if (imageUploadMode === 'upload') {
      imageUrl = uploadedMainImage;
      galleryUrls = uploadedGalleryImages;
    } else {
      imageUrl = values.image_url ?? null;
      galleryUrls = parseList(values.gallery_input);
    }

    console.log('AdminProductForm: Submitting product with images', {
      imageUploadMode,
      imageUrl,
      galleryUrlsCount: galleryUrls.length,
      galleryUrls,
      uploadedMainImage,
      uploadedGalleryImages,
    });

    const productPayload: UpsertAdminProductInput['product'] = {
      id: values.id,
      name: values.name,
      description: values.description ?? null,
      category: values.category,
      price: values.price,
      image_url: imageUrl,
      gallery_urls: galleryUrls,
      thc_content: values.thc_content,
      cbd_content: values.cbd_content,
      strain_type: values.strain_type ?? null,
      effects,
      flavors,
      stock_quantity: values.stock_quantity,
      weight_grams: values.weight_grams,
      is_active: values.is_active,
      is_featured: values.is_featured,
      lab_tested: values.lab_tested,
      lab_results_url: values.lab_results_url ?? null,
    };

    const variantsPayload: NonNullable<UpsertAdminProductInput['variants']> = values.variants
      .filter((variant) => variant.name.trim().length > 0)
      .map((variant) => ({
        id: variant.id,
        name: variant.name,
        price: variant.price,
        weight_grams: variant.weight_grams ?? undefined,
        inventory_count: variant.inventory_count ?? null,
        is_active: variant.is_active,
      }));

    await onSubmit({
      product: productPayload,
      variants: variantsPayload,
      replaceVariants: true,
    });
  });

  return (
    <form
      onSubmit={(event) => {
        void submitHandler(event);
      }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle>Product details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Wedding Cake" {...register('name')} />
              {errors.name && (
                <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={form.watch('category')}
                onValueChange={(value) =>
                  form.setValue('category', value as AdminProductFormValues['category'])
                }
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="price">Base price</Label>
            <Input id="price" type="number" step="0.01" min="0" {...register('price')} />
            {errors.price && (
              <p className="mt-1 text-xs text-destructive">{errors.price.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={4}
              placeholder="Describe the product, strain details, tasting notes..."
              {...register('description')}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="thc_content">THC %</Label>
              <Input
                id="thc_content"
                type="number"
                step="0.1"
                min="0"
                {...register('thc_content')}
              />
            </div>
            <div>
              <Label htmlFor="cbd_content">CBD %</Label>
              <Input
                id="cbd_content"
                type="number"
                step="0.1"
                min="0"
                {...register('cbd_content')}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Strain type</Label>
              <Select
                value={form.watch('strain_type') ?? undefined}
                onValueChange={(value) => {
                  if (value === '_none') {
                    form.setValue('strain_type', null);
                  } else {
                    form.setValue('strain_type', value as AdminProductFormValues['strain_type']);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select strain" />
                </SelectTrigger>
                <SelectContent>
                  {STRAIN_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                  <SelectItem value="_none">No strain metadata</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="stock_quantity">Stock quantity</Label>
                <Input id="stock_quantity" type="number" min="0" {...register('stock_quantity')} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="weight_grams">Weight (g)</Label>
                <Input
                  id="weight_grams"
                  type="number"
                  step="0.1"
                  min="0"
                  {...register('weight_grams')}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-2 rounded-md border p-3">
              <Switch
                id="is_active"
                checked={form.watch('is_active')}
                onCheckedChange={(checked) => form.setValue('is_active', checked)}
              />
              <div>
                <Label htmlFor="is_active">Active</Label>
                <p className="text-xs text-muted-foreground">Visible on the storefront</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-md border p-3">
              <Switch
                id="is_featured"
                checked={form.watch('is_featured')}
                onCheckedChange={(checked) => form.setValue('is_featured', checked)}
              />
              <div>
                <Label htmlFor="is_featured">Featured</Label>
                <p className="text-xs text-muted-foreground">Show in featured rails</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-md border p-3">
              <Switch
                id="lab_tested"
                checked={form.watch('lab_tested')}
                onCheckedChange={(checked) => form.setValue('lab_tested', checked)}
              />
              <div>
                <Label htmlFor="lab_tested">Lab tested</Label>
                <p className="text-xs text-muted-foreground">Display compliance badge</p>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="lab_results_url">Lab results URL</Label>
            <Input id="lab_results_url" placeholder="https://" {...register('lab_results_url')} />
            {errors.lab_results_url && (
              <p className="mt-1 text-xs text-destructive">{errors.lab_results_url.message}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="effects_input">Effects</Label>
              <Textarea
                id="effects_input"
                rows={3}
                placeholder="Relaxed, Creative, Euphoric"
                {...register('effects_input')}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Separate with commas or new lines.
              </p>
            </div>
            <div>
              <Label htmlFor="flavors_input">Flavors</Label>
              <Textarea
                id="flavors_input"
                rows={3}
                placeholder="Citrus, Floral"
                {...register('flavors_input')}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Separate with commas or new lines.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Product Images</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            value={imageUploadMode}
            onValueChange={(v) => setImageUploadMode(v as 'upload' | 'url')}
          >
            <TabsList className="mb-4">
              <TabsTrigger value="upload">Upload Images</TabsTrigger>
              <TabsTrigger value="url">Enter URLs</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-6">
              <ProductImageUpload
                productId={initialProduct?.id}
                variant="main"
                value={uploadedMainImage}
                onChange={(value) => {
                  if (typeof value === 'string' || value === null) {
                    setUploadedMainImage(value);
                  }
                }}
                multiple={false}
                maxFiles={1}
                label="Main Product Image"
                helperText="This image will be displayed as the primary product image"
              />

              <ProductImageUpload
                productId={initialProduct?.id}
                variant="gallery"
                value={uploadedGalleryImages}
                onChange={(value) => {
                  if (Array.isArray(value)) {
                    setUploadedGalleryImages(value);
                  } else if (value === null) {
                    setUploadedGalleryImages([]);
                  }
                }}
                multiple={true}
                maxFiles={10}
                label="Gallery Images"
                helperText="Additional images for the product gallery (max 10)"
              />
            </TabsContent>

            <TabsContent value="url" className="space-y-4">
              <div>
                <Label htmlFor="image_url">Primary image URL</Label>
                <Input
                  id="image_url"
                  placeholder="https://example.com/image.jpg"
                  {...register('image_url')}
                />
                {errors.image_url && (
                  <p className="mt-1 text-xs text-destructive">{errors.image_url.message}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Enter the URL of the main product image
                </p>
              </div>

              <div>
                <Label htmlFor="gallery_input">Gallery image URLs</Label>
                <Textarea
                  id="gallery_input"
                  rows={4}
                  placeholder={[
                    'https://example.com/image1.jpg',
                    'https://example.com/image2.jpg',
                    'https://example.com/image3.jpg',
                  ].join('\n')}
                  {...register('gallery_input')}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Enter one URL per line for gallery images
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Variants</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {variantFields.map((field, index) => (
            <div
              key={field.id}
              className={cn(
                'rounded-lg border p-4',
                !form.watch(`variants.${index}.is_active`) && 'opacity-75'
              )}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <Label htmlFor={`variant-name-${index}`}>Variant name</Label>
                  <Input
                    id={`variant-name-${index}`}
                    placeholder="1/8 oz"
                    {...register(`variants.${index}.name` as const)}
                  />
                  {errors.variants?.[index]?.name && (
                    <p className="mt-1 text-xs text-destructive">
                      {errors.variants[index]?.name?.message}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id={`variant-active-${index}`}
                    checked={form.watch(`variants.${index}.is_active`)}
                    onCheckedChange={(checked) =>
                      form.setValue(`variants.${index}.is_active`, checked)
                    }
                  />
                  <Label htmlFor={`variant-active-${index}`} className="text-sm">
                    Active
                  </Label>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor={`variant-price-${index}`}>Price</Label>
                  <Input
                    id={`variant-price-${index}`}
                    type="number"
                    min="0"
                    step="0.01"
                    {...register(`variants.${index}.price` as const)}
                  />
                </div>
                <div>
                  <Label htmlFor={`variant-weight-${index}`}>Weight (g)</Label>
                  <Input
                    id={`variant-weight-${index}`}
                    type="number"
                    min="0"
                    step="0.1"
                    {...register(`variants.${index}.weight_grams` as const)}
                  />
                </div>
                <div>
                  <Label htmlFor={`variant-inventory-${index}`}>Inventory</Label>
                  <Input
                    id={`variant-inventory-${index}`}
                    type="number"
                    min="0"
                    step="1"
                    {...register(`variants.${index}.inventory_count` as const)}
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Button type="button" variant="ghost" onClick={() => removeVariant(index)}>
                  Remove variant
                </Button>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={() => appendVariant(buildDefaultVariant())}
          >
            Add variant
          </Button>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
};

export default AdminProductForm;
