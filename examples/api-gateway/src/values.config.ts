import { APIGatewayConfig } from "~/types/all.js";
let config: APIGatewayConfig = {
    routes: {
        "/user": {
            path: "/user",
            backend: "user-service",
            rateLimit: 1000,
        },
        "/order": {
            path: "/order",
            backend: "order-service",
            rateLimit: 500,
        },
    },
};
export default config;
