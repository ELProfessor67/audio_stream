/** @type {import('next').NextConfig} */
const nextConfig = {
        experimental: {
                serverActions: {
                        bodySizeLimit: '100mb'
                }
        },
         eslint: {
        ignoreDuringBuilds: true,
       },
}

module.exports = nextConfig