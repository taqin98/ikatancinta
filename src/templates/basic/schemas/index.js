import { defaultSchema as lightBlueFloralSchema } from "../light-blue-floral/schema/invitationSchema";
import { defaultSchema as beigeNaturalSchema } from "../beige-natural/schema/invitationSchema";
import { defaultSchema as blueNatureSchema } from "../blue-nature/schema/invitationSchema";
import { defaultSchema as noirFloralSchema } from "../noir-floral/schema/invitationSchema";

const schemaBySlug = {
    "light-blue-floral": lightBlueFloralSchema,
    "rose-gold-minimalist": lightBlueFloralSchema,
    "beige-natural": beigeNaturalSchema,
    "blue-nature": blueNatureSchema,
    "noir-floral": noirFloralSchema,
};

export function getDefaultSchemaBySlug(slug) {
    return schemaBySlug[slug] || lightBlueFloralSchema;
}

export const basicSchemaRegistry = schemaBySlug;
