import { createRouter } from "@tanstack/react-router";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h1 className="text-2xl font-bold">Not Found</h1>
      <p className="mt-2">The page you are looking for does not exist.</p>
      <a href="/" className="mt-4 underline">
        Go home
      </a>
    </div>
  );
}

// Create a new router instance
export const getRouter = () => {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultNotFoundComponent: NotFound,
  });

  return router;
};
