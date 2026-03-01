import { defaultSchema as lightBlueFloralSchema } from "../light-blue-floral/schema/invitationSchema";
import { defaultSchema as beigeNaturalSchema } from "../beige-natural/schema/invitationSchema";

const schemaBySlug = {
    "light-blue-floral": lightBlueFloralSchema,
    "rose-gold-minimalist": lightBlueFloralSchema,
    "beige-natural": beigeNaturalSchema,
};

export function getDefaultSchemaBySlug(slug) {
    return schemaBySlug[slug] || lightBlueFloralSchema;
}

export const basicSchemaRegistry = schemaBySlug;
