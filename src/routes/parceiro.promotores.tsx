import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/parceiro/promotores")({
  component: () => <Outlet />,
});
