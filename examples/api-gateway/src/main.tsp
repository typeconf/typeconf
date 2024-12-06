model Route {
    path: string;
    backend: string;
    rateLimit: int32;
}

model APIGatewayConfig {
    routes: Record<Route>;
}
