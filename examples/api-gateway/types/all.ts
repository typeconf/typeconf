export type Route = {
  path: string;
  backend: string;
  rateLimit: number;
};

export type APIGatewayConfig = {
  routes: Record<string, Route>;
};
export namespace TypeSpec {}
