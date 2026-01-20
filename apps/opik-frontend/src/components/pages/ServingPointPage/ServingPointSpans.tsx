import React from "react";
import { useQuery } from "@tanstack/react-query";
import useTracesList from "@/api/traces/useTracesList";
import TracesSpansTab from "@/components/pages/TracesPage/TracesSpansTab/TracesSpansTab";
import api, { SERVICES_BASE_URL } from "@/api/api";
import Loader from "@/components/shared/Loader/Loader";
import { TRACE_DATA_TYPE } from "@/hooks/useTracesOrSpansList";
import useProjectsList from "@/api/projects/useProjectsList";
import useAppStore from "@/store/AppStore";

const ServingPointSpans: React.FC = () => {
    const workspaceName = useAppStore((state) => state.activeWorkspaceName);

    // Attempt to find the "Default Project" or fallback to the first project
    const { data: projectsData, isPending } = useProjectsList({
        workspaceName,
        page: 1,
        size: 10,
    });

    const projectId = React.useMemo(() => {
        if (!projectsData?.content) return null;
        const defaultProject = projectsData.content.find(p => p.name === "Default Project");
        return defaultProject ? defaultProject.id : projectsData.content[0]?.id;
    }, [projectsData]);

    if (isPending) return <Loader />;

    if (!projectId) {
        return <div className="flex items-center justify-center h-full text-muted-foreground">No projects found for traces.</div>;
    }

    return (
        <div className="h-full w-full overflow-hidden flex flex-col">
            <div className="p-4 border-b">
                <h3 className="text-lg font-medium">Spans (Default Project)</h3>
            </div>
            <div className="flex-1 overflow-auto">
                {/* Reusing TracesSpansTab - assuming it handles layout well */}
                <TracesSpansTab
                    projectId={projectId}
                    projectName="Default Project" // Or dynamic name
                    type={TRACE_DATA_TYPE.spans}
                />
            </div>
        </div>
    );
};

export default ServingPointSpans;
