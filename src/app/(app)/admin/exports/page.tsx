import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminExportsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Stewardship Exports</CardTitle>
        <CardDescription>
          Export scoreboards and snapshots for leadership review and reporting.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild>
          <Link href="/api/v1/exports/scoreboard">Download Scoreboard CSV</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
