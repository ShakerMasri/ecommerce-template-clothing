import type { UploadApiResponse } from "cloudinary";
import { NextResponse } from "next/server";
import { Readable } from "node:stream";
import { requireAdmin } from "~/lib/admin";
import { cloudinary } from "~/lib/cloudinary";
import { validateSameOriginRequest } from "~/lib/csrf";
import { getReferenceMessage, logError } from "~/lib/logger";
import { rateLimit } from "~/lib/rate-limit";

export const runtime = "nodejs";

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

function isAllowedImageType(type: string) {
  return ["image/jpeg", "image/png", "image/webp"].includes(type);
}

function hasAllowedImageSignature(buffer: Buffer) {
  const isJpeg =
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff;

  const isPng =
    buffer.length >= 8 &&
    buffer
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));

  const isWebp =
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP";

  return isJpeg || isPng || isWebp;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Cloudinary upload failed.";
}

function uploadBufferToCloudinary(buffer: Buffer, folder: string) {
  return new Promise<UploadApiResponse>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation: [
          {
            width: 1200,
            height: 1200,
            crop: "limit",
            quality: "auto",
            fetch_format: "auto",
          },
        ],
      },
      (error, result) => {
        if (error) {
          reject(new Error(getErrorMessage(error)));
          return;
        }

        if (!result) {
          reject(new Error("Cloudinary upload failed."));
          return;
        }

        resolve(result);
      },
    );

    Readable.from(buffer).pipe(uploadStream);
  });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();

  if (!admin.ok) {
    return admin.response;
  }
  const csrfResponse = validateSameOriginRequest(request);

  if (csrfResponse) {
    return csrfResponse;
  }

  const limited = await rateLimit(request, "adminUpload", admin.user.id);

  if (!limited.ok) {
    return limited.response;
  }

  const formData = await request.formData().catch(() => null);

  if (!formData) {
    return NextResponse.json(
      { message: "Invalid form data." },
      { status: 400 },
    );
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      {
        message: "Invalid input.",
        errors: {
          file: ["Product image file is required."],
        },
      },
      { status: 400 },
    );
  }

  if (!isAllowedImageType(file.type)) {
    return NextResponse.json(
      {
        message: "Invalid input.",
        errors: {
          file: ["Only JPG, PNG, and WEBP images are allowed."],
        },
      },
      { status: 400 },
    );
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      {
        message: "Invalid input.",
        errors: {
          file: [`Image must be ${MAX_FILE_SIZE_MB}MB or smaller.`],
        },
      },
      { status: 400 },
    );
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
      return NextResponse.json(
        {
          message: "Invalid input.",
          errors: {
            file: ["Image file cannot be empty."],
          },
        },
        { status: 400 },
      );
    }

    if (!hasAllowedImageSignature(buffer)) {
      return NextResponse.json(
        {
          message: "Invalid input.",
          errors: {
            file: ["Only valid JPG, PNG, and WEBP images are allowed."],
          },
        },
        { status: 400 },
      );
    }

    const folder =
      process.env.CLOUDINARY_PRODUCT_FOLDER ?? "ecommerce-template/products";

    const uploadedImage = await uploadBufferToCloudinary(buffer, folder);

    return NextResponse.json({
      message: "Product image uploaded successfully.",
      image: {
        url: uploadedImage.secure_url,
        publicId: uploadedImage.public_id,
        width: uploadedImage.width,
        height: uploadedImage.height,
        format: uploadedImage.format,
        bytes: uploadedImage.bytes,
      },
    });
  } catch (error) {
    const errorId = logError("Failed to upload admin product image.", error, {
      action: "admin.products.image.upload",
      route: "/api/admin/uploads/product-images",
      adminUserId: admin.user.id,
      fileSizeBytes: file.size,
      fileType: file.type,
    });

    return NextResponse.json(
      {
        message: getReferenceMessage(
          "Failed to upload product image.",
          errorId,
        ),
      },
      { status: 500 },
    );
  }
}
