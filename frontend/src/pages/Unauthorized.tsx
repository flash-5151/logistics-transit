import * as React from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/atoms/Button";
import { Stack } from "../components/layout/primitives/Stack";

const Unauthorized: React.FC = () => {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background px-4">
      <Stack gap="lg" className="max-w-md text-center items-center">
        <h1 className="text-5xl font-bold text-primary">403</h1>
        <Stack gap="xs" className="items-center">
          <h2 className="text-xl font-semibold text-text-primary">Access Denied</h2>
          <p className="text-text-secondary text-sm">
            You do not have permission to view this page. Please contact your system administrator if you think this is an error.
          </p>
        </Stack>
        <Link to="/" className="w-full">
          <Button className="w-full">Return to Dashboard</Button>
        </Link>
      </Stack>
    </div>
  );
};

export { Unauthorized };
