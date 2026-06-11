# Asset License Notes

This file records asset and media license-review notes for this clothing ecommerce template.

This is an engineering audit aid, not legal advice.

## Current Asset Audit Summary

Temporary audit files can be regenerated with:

```bash
find public src -type f | sort > asset-files.txt
grep -RInE "next/font|fonts\.googleapis|@font-face|url\(|<img|OptimizedImage|cloudinary|res\.cloudinary|lucide-react|react-icons|/[^\"' )]+\.(png|jpg|jpeg|webp|gif|svg|ico|woff2?|ttf|otf)" src public > asset-refs.txt || true
```

These generated files are local-only and should not be committed:

```txt
asset-files.txt
asset-refs.txt
```

## Findings

### Repository Static Assets

Status: resolved

Finding:

- The asset scan found `public/favicon.ico`.
- The app references this file as `/favicon.ico`.
- The original source of this favicon is currently unknown.

Decision:

- Replaced the unknown `public/favicon.ico` with a simple original `public/favicon.svg`.
- The SVG uses basic shapes and text only.
- No copied logo, icon pack, external image, or embedded font is used.

### Fonts

Status: accepted

Finding:

- The app imports `Geist` through `next/font/google`.
- No separate committed font files were found in the repository scan.

Decision:

- Geist is licensed under SIL Open Font License 1.1.
- The app uses it through `next/font/google`.
- No local modified font files are committed.
- No replacement needed.

### Product Images and Cloudinary Media

Status: accepted only after production image review

Finding:

- Product images are uploaded through Cloudinary.
- Product images are rendered through the app using `OptimizedImage`.
- Product image URLs are expected to come from Cloudinary.

Decision:

- Staging/test images are disposable and not production assets.
- Before production, every real Cloudinary product image must be client-owned, supplier-approved, original, or properly licensed.
- Unknown-source images must be removed or replaced.

### Icons, SVGs, and UI Asset Packs

Status: no separate committed icon pack found in this scan

Finding:

- The scan did not show committed SVG packs, icon packs, illustration packs, or downloaded UI assets in `public`.
- The current app mainly uses text, CSS, product images, and Cloudinary-hosted media.

Decision:

- Keep current approach.
- If icons, illustrations, templates, or UI kits are added later, record their source and license before commercial delivery.

## Required Production Actions

Before handing the project to a real client or launching production:

- Verify the original `public/favicon.svg` still matches the client brand or replace it with a client-owned asset.
- Verify the font license and keep proof.
- Verify every real product image uploaded to Cloudinary.
- Remove temporary, test, or demo product images.
- Do not use copyrighted fashion photos, model photos, product photos, brand logos, posters, supplier catalog images, or influencer/customer photos without permission.
- Keep source/license notes for all commercial assets.
