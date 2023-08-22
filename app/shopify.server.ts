import { restResources } from "@shopify/shopify-api/rest/admin/2023-07"
import {
  AppDistribution,
  DeliveryMethod,
  LATEST_API_VERSION,
  shopifyApp,
} from "@shopify/shopify-app-remix"
import "@shopify/shopify-app-remix/adapters/node"
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma"

import { shopifyApi } from "@shopify/shopify-api"
import "@shopify/shopify-api/adapters/node"
import prisma from "./db.server"

const shopify = shopifyApp({
  // アプリのクライアント ID。Shopify パートナー ダッシュボードのアプリからコピーします。これは公開です。
  apiKey: process.env.SHOPIFY_API_KEY,
  // アプリの API シークレット。Shopify パートナー ダッシュボードのアプリからコピーします。これはプライベートです。これをコミットしないでください。
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  // 使用したい管理 API のバージョン。
  // 新しいアプリを作成する場合は、LATEST_API_VERSION を使用します。
  apiVersion: LATEST_API_VERSION,
  // アプリに必要な権限。
  scopes: process.env.SCOPES?.split(","),
  // これはアプリの URL です。
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  // 使用する Shopify Admin REST API のバージョン。
  // 新しいアプリを作成する場合は、LATEST_API_VERSION を使用します。
  restResources,
  webhooks: {
    APP_UNINSTALLED: {
      deliveryMethod: DeliveryMethod.Http,
      callbackUrl: "/webhooks",
    },
  },
  hooks: {
    afterAuth: async ({ session }) => {
      shopify.registerWebhooks({ session })
    },
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
})

export default shopify
export const apiVersion = LATEST_API_VERSION
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders
export const authenticate = shopify.authenticate
export const login = shopify.login
export const registerWebhooks = shopify.registerWebhooks
export const sessionStorage = shopify.sessionStorage

export const shopifyAPI = shopifyApi({
  // The next 4 values are typically read from environment variables for added security
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: LATEST_API_VERSION,
  scopes: process.env.SCOPES?.split(","),
  hostName: process.env.SHOPIFY_APP_URL || "",
  isEmbeddedApp: false,
  restResources,
})
