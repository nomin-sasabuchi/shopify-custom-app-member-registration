/**
 * 1.会員情報のメタフィールドにカスタムアプリ側から項目を追加する
 * 2.shopify store(テーマ側)から追加項目の情報を受け取る
 * 3.1と2を結合し、追加項目の情報を受け取ったら、会員情報のメタフィールドに追加できるようにする
 */

import { json } from "@remix-run/node"
import { Form } from "@remix-run/react"
import { Layout, Page } from "@shopify/polaris"
import { UPDATE_USER } from "../queries"
import { authenticate } from "../shopify.server"

/**
 *  Get処理
 */
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request)

  return json({ shop: session.shop.replace(".myshopify.com", "") })
}

/**
 * (ユーザー情報)更新処理
 */
export async function action({ request }) {
  // await console.log('request',request)
  // console.log('test1');
  const { admin } = await authenticate.admin(request)

  await admin.graphql(UPDATE_USER, {
    variables: {
      input: {
        firstName: "笹本",
        id: "gid://shopify/Customer/7194811793682",
        metafields: [
          {
            value: "testtest+@gmail.com",
            id: "gid://shopify/Metafield/29523167707410",
          },
          { value: "男性", id: "gid://shopify/Metafield/29523200246034" },
        ],
      },
    },
  })
  return null
}

export default function MemberRegistrationPage() {
  return (
    <Page>
      <ui-title-bar title="会員情報項目追加" />
      <Layout>
        <Form method="post">
          <button>更新</button>
        </Form>
      </Layout>
    </Page>
  )
}
