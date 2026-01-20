import React, { useEffect } from "react";
import { useParams } from "@tanstack/react-router";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import ServingPointChat from "./ServingPointChat";
import ServingPointSpans from "./ServingPointSpans";
import useBreadcrumbsStore from "@/store/BreadcrumbsStore";

const ServingPointPage: React.FC = () => {
    const { serviceName } = useParams({ strict: false });
    const setBreadcrumbParam = useBreadcrumbsStore((state) => state.setParam);

    useEffect(() => {
        if (serviceName) {
            setBreadcrumbParam("serviceName", serviceName, serviceName);
        }
    }, [serviceName, setBreadcrumbParam]);

    return (
        <div className="flex h-full flex-col">
            <div className="sticky top-0 z-10 -mx-6 flex items-center justify-between gap-4 bg-soft-background px-6 pb-3 pt-6">
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <h1 className="comet-title-l truncate break-words">{serviceName}</h1>
                </div>
            </div>

            <div className="flex-1 overflow-hidden pb-4 pt-1">
                <ResizablePanelGroup direction="horizontal" className="h-full w-full rounded-md border bg-background">
                    <ResizablePanel defaultSize={50} minSize={30}>
                        <ServingPointChat />
                    </ResizablePanel>
                    <ResizableHandle />
                    <ResizablePanel defaultSize={50} minSize={30}>
                        <ServingPointSpans />
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>
        </div>
    );
};

export default ServingPointPage;
