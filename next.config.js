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
       images: {
        domains: ['localhost','localhost:4000','budgetbuddy.store']
       }
}

module.exports = nextConfig