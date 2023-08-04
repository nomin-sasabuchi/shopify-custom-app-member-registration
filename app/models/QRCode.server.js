import qrcode from "qrcode";
import db from "../db.server";

// QRコードを取得する
// QR コード編集フォーム用に 1 つの QR コードを取得する関数を作成し、アプリのインデックス 
// ページ用に複数の QR コードを取得する 2 番目の関数を作成します。
export async function getQRCode(id, graphql) {
  const QRCode = await db.qRCode.findFirst({ where: { id } });

  if (!QRCode) {
    return null;
  }

  return supplementQRCode(QRCode, graphql);
}

export async function getQRCodes(shop, graphql) {
  const QRCodes = await db.qRCode.findMany({
    where: { shop },
    orderBy: { id: "desc" },
  });

  if (!QRCodes.length) {
    return QRCodes;
  }

  return Promise.all(
    QRCodes.map(async (QRCode) => supplementQRCode(QRCode, graphql))
  );
}

/**
 *  QRコード画像を取得する
 * QR コードによりユーザーは に移動します/qrcodes/$id/scan。
 * ここで、$idは QR コードの ID です。この URL を構築する関数を作成し、
 * qrcodeパッケージを使用して Base 64 でエンコードされた QR コード イメージを返しますsrc。
 */
export async function getQRCodeImage(id) {
  const { origin } = new URL(process.env.SHOPIFY_APP_URL);

  const image = await qrcode.toBuffer(`${origin}/qrcodes/${id}/scan`);

  return `data:image/jpeg;base64, ${image.toString("base64")}`;
}

/**
 * リンク先の URL を取得する
 * QR コードをスキャンすると、ユーザーは次の 2 つの場所のいずれかに移動します。
 * - 商品詳細ページ
 * - 商品をカートに入れた状態でのチェックアウト
 * 
 * 販売者が選択した宛先に応じて、条件付きでこの URL を構築する関数を作成します。
 */
export function getDestinationUrl(QRCode) {
  if (QRCode.destination === "product") {
    return `https://${QRCode.shop}/products/${QRCode.productHandle}`;
  }

  const id = QRCode.productVariantId.replace(
    /gid:\/\/shopify\/ProductVariant\/([0-9]+)/,
    "$1"
  );

  return `https://${QRCode.shop}/cart/${id}:1`;
}

/**
 * 追加の製品およびバリアント データを取得する
 * 
 * Prisma の QR コードには製品データを追加する必要があります。
 * QRコード画像とリンク先URLも必要です。
 * 
 * Shopify Admin GraphQL APIに商品タイトル、最初の注目商品画像の URL と代替テキストをクエリする関数を作成します。
 * また、QRコードデータと製品データを含むオブジェクトを返し、
 * 作成したgetDestinationUrlおよび関数を使用してリンク先URLの
 * QRコード画像を取得する必要があります。getQRCodeImage
 */
async function supplementQRCode(QRCode, graphql) {
  const response = await graphql(
    `
      query supplementQRCode($id: ID!) {
        product(id: $id) {
          title
          images(first: 1) {
            nodes {
              altText
              url
            }
          }
        }
      }
    `,
    {
      variables: {
        id: QRCode.productId,
      },
    }
  );

  const {
    data: { product },
  } = await response.json();

  return {
    ...QRCode,
    productDeleted: !product.title,
    productTitle: product.title,
    productImage: product.images?.nodes[0]?.url,
    productAlt: product.images?.nodes[0]?.altText,
    destinationUrl: getDestinationUrl(QRCode),
    image: await getQRCodeImage(QRCode.id),
  };
}

export function validateQRCode(data) {
  const errors = {};

  if (!data.title) {
    errors.title = "Title is required";
  }

  if (!data.productId) {
    errors.productId = "Product is required";
  }

  if (!data.destination) {
    errors.destination = "Destination is required";
  }

  if (Object.keys(errors).length) {
    return errors;
  }
}
