import crypto from "crypto"
import { convertQueryParams, convertQueryParamsSchemaKeyType } from "~/domain"

/**
 * この関数は、有効な Shopify アプリケーション プロキシ リクエストで true を返します。
 * @param parsedQueryString 完全なクエリ文字列を含むオブジェクト。
 * @param shopifySecret アプリの Shopify シークレット。
 * @param nonShopifyQueryParamKeys 署名の作成に使用しないキーの配列。これは、shopify の作成後に追加のパラメーターがある場合に役立ちます。
 * @returns boolean
 */
export const verifyAppProxyHmac = (
  param?: URLSearchParams,
  shopifySecret?: string,
  nonShopifyQueryParamKeys: string[] = ["signature"]
): boolean => {
  console.log("verifyAppProxyHmac")

  if (!param || !shopifySecret) {
    return false
  }

  const queryParams = convertQueryParams(param)

  const input = Object.keys(queryParams)
    .filter(
      (key) =>
        !nonShopifyQueryParamKeys || !nonShopifyQueryParamKeys.includes(key)
    )
    .sort()
    .map((key) => {
      const value = queryParams[
        key as convertQueryParamsSchemaKeyType
      ] as string
      return `${key}=${value}`
    })
    .join("")

  const hash = crypto
    .createHmac("sha256", shopifySecret)
    .update(input)
    .digest("hex")

  return queryParams.signature === hash
}
