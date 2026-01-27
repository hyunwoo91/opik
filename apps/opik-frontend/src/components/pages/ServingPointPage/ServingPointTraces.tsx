import React, { useState, useMemo, useCallback } from "react";
import { useParams } from "@tanstack/react-router";
import { keepPreviousData } from "@tanstack/react-query";
import useTracesList from "@/api/traces/useTracesList";
import useLazySpansList from "@/api/traces/useLazySpansList";
import useTraceById from "@/api/traces/useTraceById";
import useProjectsList from "@/api/projects/useProjectsList";
import useAppStore from "@/store/AppStore";
import Loader from "@/components/shared/Loader/Loader";
import NoData from "@/components/shared/NoData/NoData";
import { COLUMN_TYPE } from "@/types/shared";
import { Span, Trace } from "@/types/traces";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import TraceTreeViewer from "@/components/pages-shared/traces/TraceDetailsPanel/TraceTreeViewer/TraceTreeViewer";
import TraceDataViewer from "@/components/pages-shared/traces/TraceDetailsPanel/TraceDataViewer/TraceDataViewer";
import TraceAnnotateViewer from "@/components/pages-shared/traces/TraceDetailsPanel/TraceAnnotateViewer/TraceAnnotateViewer";
import CommentsViewer from "@/components/pages-shared/traces/TraceDetailsPanel/CommentsViewer/CommentsViewer";
import TraceAIViewer from "@/components/pages-shared/traces/TraceDetailsPanel/TraceAIViewer/TraceAIViewer";
import {
    DetailsActionSection,
    useDetailsActionSectionState,
} from "@/components/pages-shared/traces/DetailsActionSection";
import find from "lodash/find";
import { METADATA_AGENT_GRAPH_KEY } from "@/constants/traces";
import get from "lodash/get";
import { Filters } from "@/types/filters";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { formatDate, formatDuration } from "@/lib/date";

interface ServingPointTracesProps {
    threadId: string;
    selectedTraceId: string | null;
    onSelectTrace: (id: string | null) => void;
}

const ServingPointTraces: React.FC<ServingPointTracesProps> = ({ threadId, selectedTraceId, onSelectTrace }) => {
    const { workspaceName: paramWorkspaceName, serviceName } = useParams({ strict: false });
    const storeWorkspaceName = useAppStore((state) => state.activeWorkspaceName);
    const workspaceName = paramWorkspaceName || storeWorkspaceName;

    const [spanId, setSpanId] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useDetailsActionSectionState("lastSection");

    // TraceTreeViewer specific state
    const [search, setSearch] = useState<string | undefined>(undefined);
    const [filters, setFilters] = useState<Filters>([]);

    // 1. Resolve Project ID
    const targetProjectName = serviceName;
    const { data: projectsData, isPending: isProjectsPending } = useProjectsList({
        workspaceName,
        search: targetProjectName,
        page: 1,
        size: 1,
    });

    const projectId = useMemo(() => {
        return projectsData?.content?.[0]?.id || "";
    }, [projectsData]);

    // 2. Fetch Traces for this Thread
    const { data: tracesData, isPending: isTracesPending } = useTracesList(
        {
            projectId,
            filters: [
                {
                    id: "thread-id",
                    field: "thread_id",
                    operator: "=",
                    value: threadId,
                    type: COLUMN_TYPE.string,
                },
            ],
            page: 1,
            size: 100,
            sorting: [{ id: "start_time", desc: true }],
        },
        {
            enabled: !!projectId && !!threadId,
            refetchInterval: 500,
        }
    );

    const traceId = selectedTraceId || "";

    // 3. Fetch Trace Details
    const { data: trace, isPending: isTraceDetailPending } = useTraceById(
        {
            traceId: traceId,
            stripAttachments: true,
        },
        {
            placeholderData: keepPreviousData,
            enabled: !!traceId,
        }
    );

    // 4. Fetch Spans for the Trace
    const {
        query: { data: spansData, isPending: isSpansPending },
        isLazyLoading: isSpansLazyLoading,
    } = useLazySpansList(
        {
            traceId: traceId,
            projectId,
            page: 1,
            size: 1000,
            stripAttachments: true,
        },
        {
            placeholderData: keepPreviousData,
            enabled: !!traceId && !!projectId,
        }
    );

    const handleRowSelect = useCallback(
        (id: string) => setSpanId(id === traceId ? "" : id),
        [traceId]
    );

    // Helper to safely cast or find data
    const dataToView = useMemo(() => {
        if (!trace) return undefined;
        if (spanId && spansData?.content) {
            const foundSpan = spansData.content.find((span) => span.id === spanId);
            if (foundSpan) return foundSpan;
        }
        return trace;
    }, [spanId, spansData?.content, trace]);

    if (isProjectsPending || isTracesPending) {
        return <Loader />;
    }

    // Determine content for Left Panel
    const renderLeftPanelContent = () => {
        // Mode B: Trace Selected -> Show Tree
        if (selectedTraceId && trace) {
            return (
                <div className="flex flex-col h-full">
                    <div className="flex items-center gap-2 p-2 border-b bg-muted/10 shrink-0">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onSelectTrace(null)}
                            className="h-7 w-7 p-0 shrink-0"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{trace.name}</div>
                        </div>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <TraceTreeViewer
                            projectId={projectId}
                            trace={trace}
                            spans={spansData?.content}
                            rowId={spanId || traceId}
                            onSelectRow={handleRowSelect}
                            search={search}
                            setSearch={setSearch}
                            filters={filters}
                            setFilters={setFilters}
                        />
                    </div>
                </div>
            );
        }

        // Mode A: No Selection -> Show List
        if (tracesData?.content?.length === 0) {
            return (
                <div className="flex h-full flex-col items-center justify-center p-4 text-center text-muted-slate">
                    <p>No traces yet.</p>
                </div>
            );
        }

        return (
            <div className="flex flex-col h-full">
                <div className="p-3 border-b text-sm font-medium text-muted-foreground bg-muted/5">
                    Traces ({tracesData?.content?.length || 0})
                </div>
                <div className="flex-1 overflow-y-auto">
                    {tracesData?.content?.map((t) => (
                        <div
                            key={t.id}
                            onClick={() => onSelectTrace(t.id)}
                            className="p-3 border-b cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                            <div className="font-medium text-sm mb-1 truncate">{t.name}</div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{formatDate(t.start_time)}</span>
                                <span>{formatDuration(t.duration)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="h-full w-full">
            <ResizablePanelGroup direction="horizontal" autoSaveId="serving-point-trace-sidebar">
                <ResizablePanel id="tree-viewer" defaultSize={40} minSize={20}>
                    {renderLeftPanelContent()}
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel id="data-viewer" defaultSize={60} minSize={30}>
                    {dataToView ? (
                        <TraceDataViewer
                            graphData={undefined}
                            data={dataToView as Trace | Span}
                            projectId={projectId}
                            spanId={spanId || undefined}
                            traceId={traceId}
                            activeSection={activeSection}
                            setActiveSection={setActiveSection}
                            isSpansLazyLoading={isSpansLazyLoading}
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                            Select a trace to view details
                        </div>
                    )}
                </ResizablePanel>
                {Boolean(activeSection) && dataToView && (
                    <>
                        <ResizableHandle />
                        <ResizablePanel id="last-section-viewer" defaultSize={40} minSize={30}>
                            {activeSection === DetailsActionSection.Annotations && (
                                <TraceAnnotateViewer
                                    data={dataToView as Trace | Span}
                                    spanId={spanId || ""}
                                    traceId={traceId}
                                    activeSection={activeSection}
                                    setActiveSection={setActiveSection}
                                />
                            )}
                            {activeSection === DetailsActionSection.Comments && (
                                <CommentsViewer
                                    data={dataToView as Trace | Span}
                                    spanId={spanId || ""}
                                    traceId={traceId}
                                    projectId={projectId}
                                    activeSection={activeSection}
                                    setActiveSection={setActiveSection}
                                />
                            )}
                            {activeSection === DetailsActionSection.AIAssistants && (
                                <TraceAIViewer
                                    traceId={traceId}
                                    activeSection={activeSection}
                                    setActiveSection={setActiveSection}
                                />
                            )}
                        </ResizablePanel>
                    </>
                )}
            </ResizablePanelGroup>
        </div>
    );
};

export default ServingPointTraces;

