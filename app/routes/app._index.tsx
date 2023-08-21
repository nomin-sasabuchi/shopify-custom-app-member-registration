import { LoaderArgs } from "@remix-run/node"
import { Layout, Page } from "@shopify/polaris"

export async function loader({ request }: LoaderArgs) {
  return null
}

export default function Index() {
  return (
    <Page>
      <ui-title-bar title="テスト">テスト</ui-title-bar>
      <Layout>テスト</Layout>
    </Page>
  )
}
