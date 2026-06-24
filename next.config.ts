const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const apiRemotePattern = (() => {
  if (!apiUrl) return [];

  try {
    const parsedUrl = new URL(apiUrl);
    return [
      {
        protocol: parsedUrl.protocol.replace(":", "") as "http" | "https",
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
      },
    ];
  } catch {
    return [];
  }
})();

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "i.postimg.cc",
      },
      ...apiRemotePattern,
    ],
    dangerouslyAllowSVG: true,
  },
};

export default nextConfig;
