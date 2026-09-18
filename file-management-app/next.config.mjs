/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },allowedDevOrigins: ['192.168.1.17'],
    // Thêm dòng này để cho phép truy cập từ IP của bạn
      experimental: {
        allowedDevOrigins: ['192.168.1.17', 'localhost:3000'],
          
          proxyClientMaxBodySize: '1000mb',
      },
  images: {
    unoptimized: true,
  },
    async rewrites() {
        return [
          {
            source: "/api/:path*",
            destination: "http://localhost:8000/:path*",
          },
        ];
      },
}



export default nextConfig
