import { ActionArgs, json } from "@remix-run/node"
import { DataType, Session } from "@shopify/shopify-api"
import { sessionStorage, shopifyAPI } from "~/shopify.server"
import { verifyAppProxyHmac } from "~/utils/verifyAppProxyHmac"

export async function action({ request }: ActionArgs) {
  const param = await new URL(request.url).searchParams
  const formData = await request.formData()
  console.log("body", formData)
  console.log("body", formData.get("customer[first_name]"))

  // hmac認証
  if (!verifyAppProxyHmac(param, process.env.SHOPIFY_API_SECRET))
    return json({ error: "Authentication failure" }, { status: 500 })

  // shopが取得されているかどうか
  const getShop = param.get("shop")
  if (!getShop || typeof getShop !== "string")
    return json({ error: "Missing shop header" }, { status: 500 })

  // 指定されたショップのセッションの配列を返す
  const sessions = await sessionStorage.findSessionsByShop(getShop)

  // //sessionsが取得されているかどうか
  if (!sessions || sessions.length === 0)
    return json({ error: "Shop need install app" }, { status: 500 })

  // // アクセストークンがからだった場合エラーを返す
  if (!sessions[0].accessToken)
    return json({ error: "No access token issued" }, { status: 500 })

  const client = new shopifyAPI.clients.Rest({
    session: new Session({ ...sessions[0] }),
  })

  const body = {
    customer: {
      first_name: formData.get("customer[first_name]"),
      last_name: formData.get("customer[last_name]"),
      email: formData.get("customer[email]"),
      password: formData.get("customer[password]"),
      password_confirmation: formData.get("customer[password]"),
      metafields: [
        {
          key: "date_of_birth",
          value: "1980-08-02",
          type: "date",
          namespace: "custom",
        },
        {
          key: "gender",
          value: formData.get("customer[gender]"),
          type: "single_line_text_field",
          namespace: "custom",
        },
        {
          key: "is_dm",
          value: formData.get("customer[is_dm]"),
          type: "boolean",
          namespace: "custom",
        },
      ],
    },
  }

  const res = await client.post({
    path: `/admin/api/2023-07/customers.json`,
    data: body,
    type: DataType.JSON,
  })

  return json({
    res: res,
  })
}
