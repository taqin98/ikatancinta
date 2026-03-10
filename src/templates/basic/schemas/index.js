import { defaultSchema as blueNatureSchema } from "../blue-nature/schema/invitationSchema";
import { defaultSchema as noirFloralSchema } from "../noir-floral/schema/invitationSchema";
import { defaultSchema as noirMinimalistSchema } from "../noir-minimalist/schema/invitationSchema";
import { defaultSchema as ivoryGraceSchema } from "../ivory-grace/schema/invitationSchema";
import { defaultSchema as timelessPromiseSchema } from "../../premium/timeless-promise/schema/invitationSchema";
import { defaultSchema as mistyRomanceSchema } from "../../premium/misty-romance/schema/InvitationSchema";
import { defaultSchema as velvetBurgundySchema } from "../../premium/velvet-burgundy/schema/invitationSchema";
import { defaultSchema as botanicalEleganceSchema } from "../../exclusive/botanical-elegance/schema/invitationSchema";

const schemaBySlug = {
    "blue-nature": blueNatureSchema,
    "noir-floral": noirFloralSchema,
    "noir-minimalist": noirMinimalistSchema,
    "ivory-grace": ivoryGraceSchema,
    "timeless-promise": timelessPromiseSchema,
    "misty-romance": mistyRomanceSchema,
    "velvet-burgundy": velvetBurgundySchema,
    "botanical-elegance": botanicalEleganceSchema,
};

export function getDefaultSchemaBySlug(slug) {
    return schemaBySlug[slug] || blueNatureSchema;
}

export const basicSchemaRegistry = schemaBySlug;
