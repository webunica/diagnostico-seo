/** @type {import('next').NextConfig} */
const nextConfig = {
    // Permite fetch a dominios externos desde server components
    experimental: {},
    // Aumentar timeout para análisis de sitios
    serverExternalPackages: [],
};

export default nextConfig;
