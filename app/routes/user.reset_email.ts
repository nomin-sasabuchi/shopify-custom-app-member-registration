import { ActionArgs, json } from "@remix-run/node"
import { Session } from "@shopify/shopify-api"
import { UPDATE_USER } from "~/queries"
import { sessionStorage, shopifyAPI } from "~/shopify.server"
import { verifyAppProxyHmac } from "~/utils/verifyAppProxyHmac"
export async function action({ request }: ActionArgs) {
  const param = await new URL(request.url).searchParams
  const formData = await request.formData()
  console.log("body", formData)
  console.log("body", formData.get("customer[first_name]"))
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
      query: UPDATE_USER,
      variables: {
        input: {
          id: `gid://shopify/Customer/${userId}`,
          email: formData.get("customer[reset_email]"),
        },
      },
    },
  })
  return json({
    res: res,
  })
}
