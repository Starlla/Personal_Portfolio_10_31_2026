/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export: `npm run build` writes plain HTML files to /out.
  // Fully crawlable, and hostable anywhere (Vercel, Netlify, GitHub Pages).
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
