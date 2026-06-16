import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_IMAGE =
  "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1200&auto=format&fit=crop";

const sizes = ["S", "M", "L", "XL"];
const colors = ["Black", "Cream", "Olive"];

const categories = [
  { name: "Demo Shirts / قمصان تجريبية", slug: "demo-shirts" },
  { name: "Demo Pants / بناطيل تجريبية", slug: "demo-pants" },
  { name: "Demo Jackets / جاكيتات تجريبية", slug: "demo-jackets" },
];

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  const createdCategories = [];

  for (const category of categories) {
    const savedCategory = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: category,
    });

    createdCategories.push(savedCategory);
  }

  const totalProducts = 72;

  for (let i = 1; i <= totalProducts; i += 1) {
    const category = createdCategories[i % createdCategories.length];
    const productNumber = String(i).padStart(3, "0");
    const name = `Demo Clothing Product ${productNumber} / منتج ملابس تجريبي ${productNumber}`;
    const slug = slugify(`demo-clothing-product-${productNumber}`);
    const basePrice = 79 + (i % 8) * 10;
    const hasDiscount = i % 5 === 0;

    const product = await prisma.product.upsert({
      where: { slug },
      update: {
        name,
        description:
          "Disposable demo product used for pagination, search, and category filter testing. Remove before real client launch.",
        price: basePrice,
        discountPrice: hasDiscount ? basePrice - 15 : null,
        images: [DEMO_IMAGE],
        isArchived: false,
        isFeatured: i % 9 === 0,
        showStock: i % 2 === 0,
        categoryId: category.id,
      },
      create: {
        name,
        slug,
        description:
          "Disposable demo product used for pagination, search, and category filter testing. Remove before real client launch.",
        price: basePrice,
        discountPrice: hasDiscount ? basePrice - 15 : null,
        stock: 0,
        images: [DEMO_IMAGE],
        isArchived: false,
        isFeatured: i % 9 === 0,
        showStock: i % 2 === 0,
        categoryId: category.id,
      },
    });

    for (let sizeIndex = 0; sizeIndex < sizes.length; sizeIndex += 1) {
      for (let colorIndex = 0; colorIndex < colors.length; colorIndex += 1) {
        const sizeLabel = sizes[sizeIndex];
        const colorLabel = colors[colorIndex];

        await prisma.productVariant.upsert({
          where: {
            productId_sizeKey_colorKey: {
              productId: product.id,
              sizeKey: sizeLabel.toLowerCase(),
              colorKey: colorLabel.toLowerCase(),
            },
          },
          update: {
            sizeLabel,
            colorLabel,
            stock: 3 + ((i + sizeIndex + colorIndex) % 7),
            isActive: true,
            sortOrder: sizeIndex * 10 + colorIndex,
          },
          create: {
            productId: product.id,
            sizeLabel,
            colorLabel,
            sizeKey: sizeLabel.toLowerCase(),
            colorKey: colorLabel.toLowerCase(),
            stock: 3 + ((i + sizeIndex + colorIndex) % 7),
            isActive: true,
            sortOrder: sizeIndex * 10 + colorIndex,
          },
        });
      }
    }
  }

  console.log(`Seeded ${totalProducts} disposable demo products.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
