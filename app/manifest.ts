import type { MetadataRoute } from "next";
import icon from "./icon.png";
import appleIcon from "./apple-icon.png";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KEEP",
    short_name: "KEEP",
    description: "Keep your bookmark!",
    start_url: "/",
    display: "standalone",
    icons: [
      { src: icon.src, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: appleIcon.src, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
