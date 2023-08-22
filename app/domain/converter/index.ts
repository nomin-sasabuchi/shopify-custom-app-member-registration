import { z } from "zod"

const convertQueryParamsSchema = z.object({
  shop: z.string(),
  logged_in_customer_id: z.string().optional(),
  path_prefix: z.string(),
  timestamp: z.string(),
  signature: z.string(),
})

export type convertQueryParamsSchemaType = z.infer<
  typeof convertQueryParamsSchema
>

export type convertQueryParamsSchemaKeyType = keyof convertQueryParamsSchemaType

export const convertQueryParams = (param: URLSearchParams) =>
  convertQueryParamsSchema.parse({
    shop: param.get("shop"),
    logged_in_customer_id: param.get("logged_in_customer_id")
      ? param.get("logged_in_customer_id")
      : undefined,
    path_prefix: param.get("path_prefix"),
    timestamp: param.get("timestamp"),
    signature: param.get("signature"),
  })
