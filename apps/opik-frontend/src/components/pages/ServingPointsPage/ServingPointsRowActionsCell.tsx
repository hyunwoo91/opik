import React, { useRef, useState } from "react";
import { Trash } from "lucide-react";
import { CellContext } from "@tanstack/react-table";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { UseMutationResult } from "@tanstack/react-query";
import { MoreHorizontal } from "lucide-react";
import ConfirmDialog from "@/components/shared/ConfirmDialog/ConfirmDialog";
import { ServingPoint } from "@/types/serving-points";
import { useServingPointDeleteMutation } from "@/api/serving-points/useServingPointsList";

export const ServingPointsRowActionsCell: React.FunctionComponent<
    CellContext<ServingPoint, unknown>
> = ({ row }) => {
    const resetKeyRef = useRef(0);
    const [open, setOpen] = useState<boolean>(false);
    const { mutate } = useServingPointDeleteMutation();

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="size-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem
                        onClick={() => {
                            setOpen(true);
                            resetKeyRef.current = resetKeyRef.current + 1;
                        }}
                    >
                        <Trash className="mr-2 size-4" />
                        Deregister
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <ConfirmDialog
                key={`delete-${resetKeyRef.current}`}
                open={open}
                setOpen={setOpen}
                onConfirm={() => mutate(row.original.name)}
                title="Deregister Serving Point"
                description={`Are you sure you want to deregister "${row.original.name}"? This action cannot be undone.`}
                confirmText="Deregister"
                confirmButtonVariant="destructive"
            />
        </>
    );
};
