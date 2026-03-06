import { defaultSchema as lightBlueFloralSchema } from "../light-blue-floral/schema/invitationSchema";
import { defaultSchema as beigeNaturalSchema } from "../beige-natural/schema/invitationSchema";
import { defaultSchema as blueNatureSchema } from "../blue-nature/schema/invitationSchema";
import { defaultSchema as noirFloralSchema } from "../noir-floral/schema/invitationSchema";
import { defaultSchema as timelessPromiseSchema } from "../timeless-promise/schema/invitationSchema";
import { defaultSchema as mistyRomanceSchema } from "../misty-romance/schema/InvitationSchema";
import { defaultSchema as velvetBurgundySchema } from "../velvet-burgundy/schema/invitationSchema";

const schemaBySlug = {
    "light-blue-floral": lightBlueFloralSchema,
    "rose-gold-minimalist": lightBlueFloralSchema,
    "beige-natural": beigeNaturalSchema,
    "blue-nature": blueNatureSchema,
    "noir-floral": noirFloralSchema,
    "timeless-promise": timelessPromiseSchema,
    "misty-romance": mistyRomanceSchema,
    "velvet-burgundy": velvetBurgundySchema,
};

export function getDefaultSchemaBySlug(slug) {
    return schemaBySlug[slug] || lightBlueFloralSchema;
}

export const basicSchemaRegistry = schemaBySlug;
