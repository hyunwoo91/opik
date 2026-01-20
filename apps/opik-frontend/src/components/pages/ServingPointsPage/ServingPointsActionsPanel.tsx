import React, { useCallback, useRef, useState } from "react";
import { Trash } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ServingPoint } from "@/types/serving-points";
import { useServingPointDeleteMutation } from "@/api/serving-points/useServingPointsList";
import ConfirmDialog from "@/components/shared/ConfirmDialog/ConfirmDialog";
import TooltipWrapper from "@/components/shared/TooltipWrapper/TooltipWrapper";

type ServingPointsActionsPanelsProps = {
    servingPoints: ServingPoint[];
};

const ServingPointsActionsPanel: React.FunctionComponent<
    ServingPointsActionsPanelsProps
> = ({ servingPoints }) => {
    const resetKeyRef = useRef(0);
    const [open, setOpen] = useState<boolean>(false);
    const disabled = !servingPoints?.length;

    const { mutate } = useServingPointDeleteMutation();

    const deleteServingPointsHandler = useCallback(() => {
        servingPoints.forEach((sp) => mutate(sp.name));
    }, [servingPoints, mutate]);

    return (
        <div className="flex items-center gap-2">
            <ConfirmDialog
                key={`delete-${resetKeyRef.current}`}
                open={open}
                setOpen={setOpen}
                onConfirm={deleteServingPointsHandler}
                title="Deregister serving points"
                description={`Are you sure you want to deregister ${servingPoints.length} serving point(s)? This action cannot be undone.`}
                confirmText="Deregister"
                confirmButtonVariant="destructive"
            />
            <TooltipWrapper content="Deregister">
                <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => {
                        setOpen(true);
                        resetKeyRef.current = resetKeyRef.current + 1;
                    }}
                    disabled={disabled}
                >
                    <Trash />
                </Button>
            </TooltipWrapper>
        </div>
    );
};

export default ServingPointsActionsPanel;
