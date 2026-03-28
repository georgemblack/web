import { createStart } from "@tanstack/react-start";

import { accessMiddleware } from "@/middleware/access";

export const startInstance = createStart(() => ({
  requestMiddleware: [accessMiddleware],
}));
