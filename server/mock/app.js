import cors from "cors";
import express from "express";
import multer from "multer";
import { packagePlans } from "../../src/data/packageCatalog.js";
import { invitationsByThemeSeed, themeSeed, findThemeBySlug } from "./data/themes.seed.js";
import {
  buildInvitationSchemaFromTheme,
  buildOrderId,
  cloneJson,
  serializeOrder,
  sanitizeOrderPayload,
} from "./utils.js";

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

const orderStore = [];
const wishesStore = new Map();
const uploadStore = [];
const orderEmailStore = [];

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    service: "ikatancinta-mock-api",
    date: new Date().toISOString(),
  });
});

app.get("/api/packages", (_req, res) => {
  res.json(cloneJson(packagePlans));
});

app.get("/api/themes", (req, res) => {
  const { packageTier, slug, presetId, category, status } = req.query;

  const filtered = themeSeed.filter((theme) => {
    if (packageTier && theme.packageTier !== packageTier) return false;
    if (slug && theme.slug !== slug) return false;
    if (presetId && theme.presetId !== presetId) return false;
    if (category && theme.category !== category) return false;
    if (status && theme.status !== status) return false;
    return true;
  });

  res.json(cloneJson(filtered));
});

app.get("/api/themes/:slug/invitations", (req, res) => {
  const theme = findThemeBySlug(req.params.slug);
  if (!theme) {
    res.status(404).json({ message: "Theme not found" });
    return;
  }

  res.json(cloneJson(invitationsByThemeSeed[req.params.slug] || []));
});

app.get("/api/invitations/:slug", (req, res) => {
  const theme = findThemeBySlug(req.params.slug);
  if (!theme) {
    res.status(404).json({ message: "Invitation theme not found" });
    return;
  }

  const invitation = buildInvitationSchemaFromTheme(req.params.slug);
  const storedWishes = wishesStore.get(req.params.slug) || [];

  if (Array.isArray(invitation.wishes?.initial)) {
    invitation.wishes.initial = [...storedWishes, ...invitation.wishes.initial];
  }

  res.json(cloneJson(invitation));
});

app.post("/api/invitations/:slug/wishes", (req, res) => {
  const theme = findThemeBySlug(req.params.slug);
  if (!theme) {
    res.status(404).json({ message: "Invitation theme not found" });
    return;
  }

  const entry = {
    author: req.body?.name || "Anonim",
    comment: req.body?.message || "",
    attendance: req.body?.attendance || "hadir",
    createdAt: new Date().toISOString(),
  };

  const current = wishesStore.get(req.params.slug) || [];
  wishesStore.set(req.params.slug, [entry, ...current]);

  res.status(201).json({
    success: true,
    message: "Wish accepted",
    data: entry,
  });
});

app.post("/api/orders", (req, res) => {
  const sanitized = sanitizeOrderPayload(req.body);
  if (sanitized.error === "THEME_NOT_FOUND") {
    res.status(404).json({ message: "Theme not found" });
    return;
  }
  if (sanitized.error === "THEME_PACKAGE_MISMATCH") {
    res.status(422).json({ message: "Selected theme does not match selected package" });
    return;
  }

  const order = {
    id: buildOrderId(),
    createdAt: new Date().toISOString(),
    status: "processing",
    payload: sanitized.value,
  };

  orderStore.unshift(order);
  const serialized = serializeOrder(order);

  res.status(201).json({
    success: true,
    orderId: serialized.orderId,
    createdAt: serialized.createdAt,
    completedAt: serialized.completedAt,
    status: serialized.status,
    message: "Pesanan berhasil diterima dan sedang diproses admin.",
    data: {
      orderId: serialized.orderId,
      customerName: serialized.customerName,
      packageTier: serialized.packageTier,
      themeSlug: serialized.themeSlug,
      themeName: serialized.themeName,
      totalPrice: serialized.totalPrice,
    },
  });
});

app.get("/api/orders", (_req, res) => {
  res.json(
    orderStore.map((order) => {
      const serialized = serializeOrder(order);
      return {
        id: serialized.id,
        orderId: serialized.orderId,
        createdAt: serialized.createdAt,
        completedAt: serialized.completedAt,
        status: serialized.status,
        packageTier: serialized.packageTier,
        themeSlug: serialized.themeSlug,
        customerName: serialized.customerName,
      };
    }),
  );
});

app.get("/api/orders/:orderId", (req, res) => {
  const order = orderStore.find((entry) => entry.id === req.params.orderId);
  if (!order) {
    res.status(404).json({ message: "Order not found" });
    return;
  }

  res.json({
    success: true,
    data: serializeOrder(order),
  });
});

app.post("/api/orders/email", (req, res) => {
  const payload = {
    id: `email_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    orderId: req.body?.orderId || null,
    customerEmail: req.body?.customer?.email || null,
    status: "queued",
    createdAt: new Date().toISOString(),
  };

  orderEmailStore.unshift(payload);

  res.status(202).json({
    success: true,
    message: "Email notification queued by mock API.",
    data: payload,
  });
});

app.post("/api/uploads", (req, res) => {
  upload.single("file")(req, res, (error) => {
    if (error) {
      res.status(400).json({ message: error.message || "Upload failed" });
      return;
    }

    const assetId = `asset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const filename = req.file?.originalname || req.body?.name || "asset";
    const asset = {
      assetId,
      kind: req.body?.kind || "file",
      name: filename,
      mimeType: req.file?.mimetype || req.body?.mimeType || "application/octet-stream",
      size: req.file?.size || (req.body?.size ? Number(req.body.size) : null),
      url: `http://127.0.0.1:3001/mock-assets/${assetId}/${encodeURIComponent(filename)}`,
      createdAt: new Date().toISOString(),
      storage: "memory",
    };

    uploadStore.unshift(asset);

    res.status(201).json({
      success: true,
      ...asset,
    });
  });
});

app.get("/api/uploads", (_req, res) => {
  res.json(uploadStore);
});

export default app;
