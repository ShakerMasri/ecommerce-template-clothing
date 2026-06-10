import type { Prisma } from "@prisma/client";

type ProductPriceSnapshot = {
  price: Prisma.Decimal;
  discountPrice: Prisma.Decimal | null;
};

export function getEffectiveProductPrice(product: ProductPriceSnapshot) {
  return product.discountPrice ?? product.price;
}
