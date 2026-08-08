import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  uniqueIndex,
  index,
  real,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ────────────────────────────────────────────────────────────────────
export const userRoleEnum = pgEnum("user_role", [
  "super_admin",
  "admin",
  "manager",
  "courier",
  "customer",
]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "picked_up",
  "delivering",
  "delivered",
  "cancelled",
  "returned",
]);
export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "card",
  "wallet",
  "payme",
  "click",
  "uzum",
]);
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
  "failed",
  "refunded",
]);
export const genderEnum = pgEnum("gender", ["male", "female", "other"]);
export const discountTypeEnum = pgEnum("discount_type", [
  "percentage",
  "fixed",
]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "order",
  "promo",
  "system",
  "delivery",
]);
export const productStatusEnum = pgEnum("product_status", [
  "active",
  "inactive",
  "out_of_stock",
  "discontinued",
]);
export const bannerTypeEnum = pgEnum("banner_type", [
  "main",
  "category",
  "promo",
  "brand",
]);
export const activityTypeEnum = pgEnum("activity_type", [
  "create",
  "update",
  "delete",
  "login",
  "logout",
  "view",
]);

// ─── Users ─────────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  email: varchar("email", { length: 255 }),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  avatar: text("avatar"),
  passwordHash: text("password_hash"),
  gender: genderEnum("gender"),
  birthDate: timestamp("birth_date"),
  role: userRoleEnum("role").default("customer").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  bonusPoints: integer("bonus_points").default(0).notNull(),
  walletBalance: decimal("wallet_balance", { precision: 12, scale: 2 }).default("0").notNull(),
  fcmToken: text("fcm_token"),
  language: varchar("language", { length: 10 }).default("uz"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── OTP ───────────────────────────────────────────────────────────────────────
export const otpCodes = pgTable("otp_codes", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 20 }).notNull(),
  code: varchar("code", { length: 10 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false).notNull(),
  attempts: integer("attempts").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Refresh Tokens ────────────────────────────────────────────────────────────
export const refreshTokens = pgTable("refresh_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Addresses ─────────────────────────────────────────────────────────────────
export const addresses = pgTable("addresses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 100 }).notNull(),
  fullAddress: text("full_address").notNull(),
  apartment: varchar("apartment", { length: 50 }),
  entrance: varchar("entrance", { length: 20 }),
  floor: varchar("floor", { length: 10 }),
  latitude: real("latitude"),
  longitude: real("longitude"),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Categories ────────────────────────────────────────────────────────────────
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id"),
  name: varchar("name", { length: 200 }).notNull(),
  nameRu: varchar("name_ru", { length: 200 }),
  nameEn: varchar("name_en", { length: 200 }),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  description: text("description"),
  image: text("image"),
  icon: text("icon"),
  color: varchar("color", { length: 20 }),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Brands ────────────────────────────────────────────────────────────────────
export const brands = pgTable("brands", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  description: text("description"),
  logo: text("logo"),
  website: text("website"),
  country: varchar("country", { length: 100 }),
  isActive: boolean("is_active").default(true).notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Products ──────────────────────────────────────────────────────────────────
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => categories.id),
  brandId: integer("brand_id").references(() => brands.id),
  name: varchar("name", { length: 300 }).notNull(),
  nameRu: varchar("name_ru", { length: 300 }),
  nameEn: varchar("name_en", { length: 300 }),
  slug: varchar("slug", { length: 300 }).notNull().unique(),
  description: text("description"),
  descriptionRu: text("description_ru"),
  descriptionEn: text("description_en"),
  ingredients: text("ingredients"),
  barcode: varchar("barcode", { length: 100 }),
  sku: varchar("sku", { length: 100 }).unique(),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  oldPrice: decimal("old_price", { precision: 12, scale: 2 }),
  discountPercent: integer("discount_percent").default(0),
  costPrice: decimal("cost_price", { precision: 12, scale: 2 }),
  weight: decimal("weight", { precision: 10, scale: 3 }),
  weightUnit: varchar("weight_unit", { length: 20 }).default("g"),
  volume: decimal("volume", { precision: 10, scale: 3 }),
  volumeUnit: varchar("volume_unit", { length: 20 }),
  calories: integer("calories"),
  proteins: decimal("proteins", { precision: 8, scale: 2 }),
  fats: decimal("fats", { precision: 8, scale: 2 }),
  carbohydrates: decimal("carbohydrates", { precision: 8, scale: 2 }),
  manufacturer: varchar("manufacturer", { length: 300 }),
  countryOfOrigin: varchar("country_of_origin", { length: 100 }),
  expiryDays: integer("expiry_days"),
  storageConditions: text("storage_conditions"),
  status: productStatusEnum("status").default("active").notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),
  isNew: boolean("is_new").default(false).notNull(),
  isOrganic: boolean("is_organic").default(false).notNull(),
  totalSold: integer("total_sold").default(0).notNull(),
  totalViews: integer("total_views").default(0).notNull(),
  averageRating: real("average_rating").default(0),
  reviewCount: integer("review_count").default(0).notNull(),
  tags: jsonb("tags").$type<string[]>().default([]),
  metaTitle: varchar("meta_title", { length: 300 }),
  metaDescription: text("meta_description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Product Images ────────────────────────────────────────────────────────────
export const productImages = pgTable("product_images", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  altText: varchar("alt_text", { length: 200 }),
  sortOrder: integer("sort_order").default(0).notNull(),
  isPrimary: boolean("is_primary").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Product Videos ────────────────────────────────────────────────────────────
export const productVideos = pgTable("product_videos", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  thumbnail: text("thumbnail"),
  title: varchar("title", { length: 200 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Related Products ──────────────────────────────────────────────────────────
export const relatedProducts = pgTable("related_products", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  relatedProductId: integer("related_product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  relationType: varchar("relation_type", { length: 50 }).default("similar"),
});

// ─── Inventory ─────────────────────────────────────────────────────────────────
export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }).unique(),
  quantity: integer("quantity").default(0).notNull(),
  reservedQuantity: integer("reserved_quantity").default(0).notNull(),
  minQuantity: integer("min_quantity").default(10).notNull(),
  maxQuantity: integer("max_quantity"),
  warehouseLocation: varchar("warehouse_location", { length: 100 }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Inventory Transactions ────────────────────────────────────────────────────
export const inventoryTransactions = pgTable("inventory_transactions", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  type: varchar("type", { length: 50 }).notNull(), // in, out, adjust, return
  quantity: integer("quantity").notNull(),
  previousQuantity: integer("previous_quantity").notNull(),
  newQuantity: integer("new_quantity").notNull(),
  reason: text("reason"),
  reference: varchar("reference", { length: 100 }),
  adminId: integer("admin_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Banners ───────────────────────────────────────────────────────────────────
export const banners = pgTable("banners", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 300 }).notNull(),
  titleRu: varchar("title_ru", { length: 300 }),
  titleEn: varchar("title_en", { length: 300 }),
  subtitle: text("subtitle"),
  image: text("image").notNull(),
  mobileImage: text("mobile_image"),
  link: text("link"),
  type: bannerTypeEnum("type").default("main").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  startsAt: timestamp("starts_at"),
  endsAt: timestamp("ends_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Promotions ────────────────────────────────────────────────────────────────
export const promotions = pgTable("promotions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 300 }).notNull(),
  nameRu: varchar("name_ru", { length: 300 }),
  description: text("description"),
  image: text("image"),
  discountType: discountTypeEnum("discount_type").notNull(),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  minOrderAmount: decimal("min_order_amount", { precision: 12, scale: 2 }),
  maxDiscountAmount: decimal("max_discount_amount", { precision: 12, scale: 2 }),
  isActive: boolean("is_active").default(true).notNull(),
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Promotion Products ────────────────────────────────────────────────────────
export const promotionProducts = pgTable("promotion_products", {
  id: serial("id").primaryKey(),
  promotionId: integer("promotion_id").notNull().references(() => promotions.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
});

// ─── Coupons ───────────────────────────────────────────────────────────────────
export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  discountType: discountTypeEnum("discount_type").notNull(),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  minOrderAmount: decimal("min_order_amount", { precision: 12, scale: 2 }),
  maxDiscountAmount: decimal("max_discount_amount", { precision: 12, scale: 2 }),
  usageLimit: integer("usage_limit"),
  usageLimitPerUser: integer("usage_limit_per_user").default(1),
  usedCount: integer("used_count").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  startsAt: timestamp("starts_at"),
  endsAt: timestamp("ends_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Coupon Usage ──────────────────────────────────────────────────────────────
export const couponUsage = pgTable("coupon_usage", {
  id: serial("id").primaryKey(),
  couponId: integer("coupon_id").notNull().references(() => coupons.id),
  userId: integer("user_id").notNull().references(() => users.id),
  orderId: integer("order_id"),
  usedAt: timestamp("used_at").defaultNow().notNull(),
});

// ─── Wishlists ─────────────────────────────────────────────────────────────────
export const wishlists = pgTable("wishlists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Cart ──────────────────────────────────────────────────────────────────────
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  quantity: integer("quantity").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Orders ────────────────────────────────────────────────────────────────────
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
  userId: integer("user_id").notNull().references(() => users.id),
  addressId: integer("address_id").references(() => addresses.id),
  courierId: integer("courier_id").references(() => users.id),
  status: orderStatusEnum("status").default("pending").notNull(),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).default("0").notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0").notNull(),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  paymentStatus: paymentStatusEnum("payment_status").default("pending").notNull(),
  couponId: integer("coupon_id").references(() => coupons.id),
  couponDiscount: decimal("coupon_discount", { precision: 10, scale: 2 }).default("0"),
  bonusPointsUsed: integer("bonus_points_used").default(0),
  bonusPointsEarned: integer("bonus_points_earned").default(0),
  walletAmountUsed: decimal("wallet_amount_used", { precision: 10, scale: 2 }).default("0"),
  deliveryAddress: text("delivery_address"),
  deliveryLatitude: real("delivery_latitude"),
  deliveryLongitude: real("delivery_longitude"),
  estimatedDeliveryAt: timestamp("estimated_delivery_at"),
  deliveredAt: timestamp("delivered_at"),
  cancelledAt: timestamp("cancelled_at"),
  cancelReason: text("cancel_reason"),
  notes: text("notes"),
  rating: integer("rating"),
  ratingComment: text("rating_comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Order Items ───────────────────────────────────────────────────────────────
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id),
  productName: varchar("product_name", { length: 300 }).notNull(),
  productImage: text("product_image"),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0"),
});

// ─── Order Status History ──────────────────────────────────────────────────────
export const orderStatusHistory = pgTable("order_status_history", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  status: orderStatusEnum("status").notNull(),
  comment: text("comment"),
  changedBy: integer("changed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Delivery Tracking ─────────────────────────────────────────────────────────
export const deliveryTracking = pgTable("delivery_tracking", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  courierId: integer("courier_id").references(() => users.id),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  heading: real("heading"),
  speed: real("speed"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Couriers ──────────────────────────────────────────────────────────────────
export const couriers = pgTable("couriers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  vehicleType: varchar("vehicle_type", { length: 50 }),
  vehicleNumber: varchar("vehicle_number", { length: 50 }),
  licenseNumber: varchar("license_number", { length: 100 }),
  isOnline: boolean("is_online").default(false).notNull(),
  isAvailable: boolean("is_available").default(true).notNull(),
  currentLatitude: real("current_latitude"),
  currentLongitude: real("current_longitude"),
  totalDeliveries: integer("total_deliveries").default(0).notNull(),
  averageRating: real("average_rating").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Reviews ───────────────────────────────────────────────────────────────────
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id),
  orderId: integer("order_id").references(() => orders.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  images: jsonb("images").$type<string[]>().default([]),
  isVerified: boolean("is_verified").default(false).notNull(),
  isApproved: boolean("is_approved").default(false).notNull(),
  helpfulCount: integer("helpful_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Notifications ─────────────────────────────────────────────────────────────
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 300 }).notNull(),
  body: text("body").notNull(),
  type: notificationTypeEnum("type").default("system").notNull(),
  data: jsonb("data"),
  isRead: boolean("is_read").default(false).notNull(),
  isGlobal: boolean("is_global").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Gift Cards ────────────────────────────────────────────────────────────────
export const giftCards = pgTable("gift_cards", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  balance: decimal("balance", { precision: 12, scale: 2 }).notNull(),
  purchasedByUserId: integer("purchased_by_user_id").references(() => users.id),
  usedByUserId: integer("used_by_user_id").references(() => users.id),
  isActive: boolean("is_active").default(true).notNull(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Wallet Transactions ───────────────────────────────────────────────────────
export const walletTransactions = pgTable("wallet_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(), // credit, debit
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  balanceBefore: decimal("balance_before", { precision: 12, scale: 2 }).notNull(),
  balanceAfter: decimal("balance_after", { precision: 12, scale: 2 }).notNull(),
  description: text("description"),
  reference: varchar("reference", { length: 100 }),
  orderId: integer("order_id").references(() => orders.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Bonus Transactions ────────────────────────────────────────────────────────
export const bonusTransactions = pgTable("bonus_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(), // earn, spend, expire
  points: integer("points").notNull(),
  pointsBefore: integer("points_before").notNull(),
  pointsAfter: integer("points_after").notNull(),
  description: text("description"),
  orderId: integer("order_id").references(() => orders.id),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Recently Viewed ───────────────────────────────────────────────────────────
export const recentlyViewed = pgTable("recently_viewed", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
});

// ─── Search History ────────────────────────────────────────────────────────────
export const searchHistory = pgTable("search_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  query: varchar("query", { length: 300 }).notNull(),
  resultsCount: integer("results_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Roles & Permissions ───────────────────────────────────────────────────────
export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  module: varchar("module", { length: 100 }).notNull(),
  action: varchar("action", { length: 50 }).notNull(), // create, read, update, delete
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  isSystem: boolean("is_system").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const rolePermissions = pgTable("role_permissions", {
  id: serial("id").primaryKey(),
  roleId: integer("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  permissionId: integer("permission_id").notNull().references(() => permissions.id, { onDelete: "cascade" }),
});

export const userRoles = pgTable("user_roles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  roleId: integer("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
});

// ─── Activity Logs ─────────────────────────────────────────────────────────────
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  type: activityTypeEnum("type").notNull(),
  module: varchar("module", { length: 100 }).notNull(),
  description: text("description").notNull(),
  metadata: jsonb("metadata"),
  ipAddress: varchar("ip_address", { length: 50 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Returns ───────────────────────────────────────────────────────────────────
export const returns = pgTable("returns", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  userId: integer("user_id").notNull().references(() => users.id),
  reason: text("reason").notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(),
  images: jsonb("images").$type<string[]>().default([]),
  refundAmount: decimal("refund_amount", { precision: 12, scale: 2 }),
  adminNotes: text("admin_notes"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Chat Messages ─────────────────────────────────────────────────────────────
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  adminId: integer("admin_id").references(() => users.id),
  message: text("message").notNull(),
  isFromUser: boolean("is_from_user").default(true).notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  attachments: jsonb("attachments").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Settings ──────────────────────────────────────────────────────────────────
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 200 }).notNull().unique(),
  value: text("value"),
  valueJson: jsonb("value_json"),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Relations ─────────────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  addresses: many(addresses),
  orders: many(orders),
  wishlists: many(wishlists),
  cartItems: many(cartItems),
  reviews: many(reviews),
  notifications: many(notifications),
  walletTransactions: many(walletTransactions),
  bonusTransactions: many(bonusTransactions),
  recentlyViewed: many(recentlyViewed),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  brand: one(brands, { fields: [products.brandId], references: [brands.id] }),
  images: many(productImages),
  videos: many(productVideos),
  inventory: one(inventory, { fields: [products.id], references: [inventory.productId] }),
  reviews: many(reviews),
  orderItems: many(orderItems),
  wishlists: many(wishlists),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  address: one(addresses, { fields: [orders.addressId], references: [addresses.id] }),
  items: many(orderItems),
  statusHistory: many(orderStatusHistory),
  tracking: many(deliveryTracking),
}));
