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
    mimeTypes: ["image/*"],
  },
  access: {
    read: () => true,
  },
};
