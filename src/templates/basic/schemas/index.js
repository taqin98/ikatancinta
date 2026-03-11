import { defaultSchema as blueNatureSchema } from "../../premium/blue-nature/schema/invitationSchema";
import { defaultSchema as noirMinimalistSchema } from "../noir-minimalist/schema/invitationSchema";
import { defaultSchema as ivoryGraceSchema } from "../ivory-grace/schema/invitationSchema";
import { defaultSchema as timelessPromiseSchema } from "../../premium/timeless-promise/schema/invitationSchema";
import { defaultSchema as mistyRomanceSchema } from "../../premium/misty-romance/schema/InvitationSchema";
import { defaultSchema as velvetBurgundySchema } from "../../premium/velvet-burgundy/schema/invitationSchema";
import { defaultSchema as botanicalEleganceSchema } from "../../exclusive/botanical-elegance/schema/invitationSchema";
import { defaultSchema as puspaAsmaraSchema } from "../../exclusive/puspa-asmara/schema/invitationSchema";

const schemaBySlug = {
    "blue-nature": blueNatureSchema,
    "noir-minimalist": noirMinimalistSchema,
    "ivory-grace": ivoryGraceSchema,
    "timeless-promise": timelessPromiseSchema,
    "misty-romance": mistyRomanceSchema,
    "velvet-burgundy": velvetBurgundySchema,
    "botanical-elegance": botanicalEleganceSchema,
    "puspa-asmara": puspaAsmaraSchema,
};

export function getDefaultSchemaBySlug(slug) {
    return schemaBySlug[slug] || blueNatureSchema;
}

export const basicSchemaRegistry = schemaBySlug;
