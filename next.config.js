/** @type {import('next').NextConfig} */
const nextConfig = {
        experimental: {
                serverActions: {
                        bodySizeLimit: '1000mb'
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