import { ActionArgs, LoaderArgs, json } from "@remix-run/node"
import { Session } from "@shopify/shopify-api"
import { GET_USER, UPDATE_METAFIELDS, UPDATE_USER } from "~/queries"
import { sessionStorage, shopifyAPI } from "~/shopify.server"
import { verifyAppProxyHmac } from "~/utils/verifyAppProxyHmac"
export async function loader({ request }: LoaderArgs) {
  const param = await new URL(request.url).searchParams
  // // ログインしているかどうか
  const userId = param.get("logged_in_customer_id")
  if (!userId) return json({ error: "User not logged in" }, { status: 500 })

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

  const client = new shopifyAPI.clients.Graphql({
    session: new Session({ ...sessions[0] }),
  })

  const res = await client.query({
    data: {
      query: GET_USER,
      variables: {
        id: `gid://shopify/Customer/${userId}`,
      },
    },
  })

  console.log("res", res.body)

  return json({
    res: res.body,
  })
}

export async function action({ request }: ActionArgs) {
  const param = await new URL(request.url).searchParams
  const formData = await request.formData()
  // // ログインしているかどうか
  const userId = param.get("logged_in_customer_id")
  if (!userId) return json({ error: "User not logged in" }, { status: 500 })

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

  const client = new shopifyAPI.clients.Graphql({
    session: new Session({ ...sessions[0] }),
  })

  const updateCustomerRes = await client.query({
    data: {
      query: UPDATE_USER,
      variables: {
        input: {
          id: `gid://shopify/Customer/${userId}`,
          firstName: formData.get("customer[first_name]"),
          lastName: formData.get("customer[last_name]"),
          email: formData.get("customer[email]"),
          addresses: [
            {
              address1: formData.get("address[address1]"),
              address2: formData.get("address[address2]"),
              city: formData.get("address[city]"),
              company: formData.get("address[company]"),
              firstName: formData.get("customer[first_name]"),
              lastName: formData.get("customer[last_name]"),
              phone: formData.get("address[phone]"),
              zip: formData.get("address[zip]"),
            },
          ],
        },
      },
    },
  })
  const updateCustomerMetafieldsRes = await client.query({
    data: {
      query: UPDATE_METAFIELDS,
      variables: {
        metafields: [
          {
            key: "gender",
            namespace: "custom",
            ownerId: `gid://shopify/Customer/${userId}`,
            type: "single_line_text_field",
            value: "男性",
          },
          {
            ownerId: `gid://shopify/Customer/${userId}`,
            key: "date_of_birth",
            value: new Date("2023-02-11"),
            type: "date",
            namespace: "custom",
          },
          {
            ownerId: `gid://shopify/Customer/${userId}`,
            key: "is_dm",
            value: formData.get("customer[is_dm]"),
            type: "boolean",
            namespace: "custom",
          },
        ],
      },
    },
  })

  return json({
    updateCustomerRes: updateCustomerRes,
    updateCustomerMetafieldsRes: updateCustomerMetafieldsRes,
  })
}
