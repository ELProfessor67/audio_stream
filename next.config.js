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
        // Album art synced from HGC Radio is served straight from Cloudinary, so
        // that host has to be allowed or next/image answers 400 and the cover
        // renders broken in the DJ panel.
        remotePatterns: [
         { protocol: 'https', hostname: 'res.cloudinary.com' },
         { protocol: 'https', hostname: 'backend.hgdjlive.com' },
         { protocol: 'https', hostname: 'budgetbuddy.store' },
         { protocol: 'http', hostname: 'localhost' },
         { protocol: 'http', hostname: 'localhost', port: '4000' },
        ]
       }
}

module.exports = nextConfig