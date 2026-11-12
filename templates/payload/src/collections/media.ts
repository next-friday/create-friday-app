import type {CollectionConfig} from "payload";

export const Media: CollectionConfig = {
  slug: "media",
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
    },
  ],
  upload: {
    mimeTypes: ["image/avif", "image/gif", "image/jpeg", "image/png", "image/webp"],
  },
  access: {
    read: () => true,
  },
};
