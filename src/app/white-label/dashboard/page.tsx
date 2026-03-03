"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { RouteGuard } from "@/components/guards/route-guard";

export default function WhiteLabelDashboardPage() {
    return (
        <DashboardLayout title="White-label Dashboard" description="Manage your white-label workspace.">
            <RouteGuard title="White-label Dashboard" requiredRoles={["white_label_admin"]} unauthorizedRedirectTo="/403">
                <div className="space-y-4">
                    <div className="content-card">
                        <div className="text-sm font-semibold text-foreground">Overview</div>
                        <div className="mt-2 text-sm text-muted-foreground">Your white-label admin dashboard is ready.</div>
                    </div>
                </div>
            </RouteGuard>
        </DashboardLayout>
    );
}
