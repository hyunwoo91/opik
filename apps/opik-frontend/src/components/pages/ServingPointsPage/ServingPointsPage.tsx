import React, { useMemo, useState, useCallback } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { StringParam, useQueryParam, JsonParam } from "use-query-params";
import { ColumnSort, ColumnPinningState } from "@tanstack/react-table";
import useLocalStorageState from "use-local-storage-state";

import DataTable from "@/components/shared/DataTable/DataTable";
import DataTableNoData from "@/components/shared/DataTableNoData/DataTableNoData";
import { useServingPointsList } from "@/api/serving-points/useServingPointsList";
import { ServingPoint } from "@/types/serving-points";
import Loader from "@/components/shared/Loader/Loader";
import useAppStore from "@/store/AppStore";
import SearchInput from "@/components/shared/SearchInput/SearchInput";
import { Separator } from "@/components/ui/separator";
import ColumnsButton from "@/components/shared/ColumnsButton/ColumnsButton";
import {
    COLUMN_NAME_ID,
    COLUMN_SELECT_ID,
    COLUMN_TYPE,
    ColumnData,
} from "@/types/shared";
import {
    convertColumnDataToColumn,
    mapColumnDataFields,
} from "@/lib/table";
import {
    generateActionsColumDef,
    generateSelectColumDef,
    getRowId as getDefaultRowId,
} from "@/components/shared/DataTable/utils";

import ServingPointsActionsPanel from "./ServingPointsActionsPanel";
import { ServingPointsRowActionsCell } from "./ServingPointsRowActionsCell";


const SELECTED_COLUMNS_KEY = "serving-points-selected-columns";
const COLUMNS_WIDTH_KEY = "serving-points-columns-width";
const COLUMNS_ORDER_KEY = "serving-points-columns-order";
const COLUMNS_SORT_KEY = "serving-points-columns-sort";

const DEFAULT_SELECTED_COLUMNS: string[] = ["url", "type", "target_as"];

export const DEFAULT_COLUMN_PINNING: ColumnPinningState = {
    left: [COLUMN_SELECT_ID, COLUMN_NAME_ID],
    right: [],
};

const ServingPointsPage: React.FC = () => {
    const navigate = useNavigate();
    const workspaceName = useAppStore((state) => state.activeWorkspaceName);
    const { data: servingPointsData, isPending } = useServingPointsList({
        enabled: true,
    });

    const [search = "", setSearch] = useQueryParam("search", StringParam, {
        updateType: "replaceIn",
    });

    const [rowSelection = {}, setRowSelection] = useQueryParam(
        "selection",
        JsonParam,
        {
            updateType: "replaceIn",
        },
    );

    const [sortedColumns, setSortedColumns] = useLocalStorageState<ColumnSort[]>(
        COLUMNS_SORT_KEY,
        {
            defaultValue: [],
        },
    );

    const [selectedColumns, setSelectedColumns] = useLocalStorageState<string[]>(
        SELECTED_COLUMNS_KEY,
        {
            defaultValue: DEFAULT_SELECTED_COLUMNS,
        },
    );

    const [columnsOrder, setColumnsOrder] = useLocalStorageState<string[]>(
        COLUMNS_ORDER_KEY,
        {
            defaultValue: [],
        },
    );

    const [columnsWidth, setColumnsWidth] = useLocalStorageState<
        Record<string, number>
    >(COLUMNS_WIDTH_KEY, {
        defaultValue: {},
    });

    // Client-side filtering and sorting
    const servingPoints = useMemo(() => {
        if (!servingPointsData) return [];
        let data = servingPointsData;

        if (search) {
            data = data.filter((sp) =>
                sp.name.toLowerCase().includes(search.toLowerCase())
            );
        }

        if (sortedColumns.length > 0) {
            const sort = sortedColumns[0];
            data = [...data].sort((a, b) => {
                const aVal = a[sort.id as keyof ServingPoint] || "";
                const bVal = b[sort.id as keyof ServingPoint] || "";
                if (aVal < bVal) return sort.desc ? 1 : -1;
                if (aVal > bVal) return sort.desc ? -1 : 1;
                return 0;
            });
        }
        return data;
    }, [servingPointsData, search, sortedColumns]);

    const columnsDef: ColumnData<ServingPoint>[] = useMemo(() => [
        {
            id: COLUMN_NAME_ID,
            label: "Name",
            type: COLUMN_TYPE.string,
            accessorFn: (row) => row.name,
            sortable: true,
            cell: (context: any) => {
                const name = context.getValue() as string;
                return (
                    <Link
                        to="/$workspaceName/debugging/connections/$serviceName"
                        params={{ workspaceName, serviceName: name }}
                        className="font-medium hover:underline text-foreground"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {name}
                    </Link>
                );
            }
        },
        {
            id: "url",
            label: "URL",
            type: COLUMN_TYPE.string,
            accessorFn: (row) => row.url,
            sortable: true,
        },
        {
            id: "type",
            label: "Type",
            type: COLUMN_TYPE.string,
            accessorFn: (row) => row.type || "-",
            sortable: true,
        },
        {
            id: "target_as",
            label: "Target As",
            type: COLUMN_TYPE.string,
            accessorFn: (row) => row.target_as || "-",
            sortable: true,
        }
    ], [workspaceName]);

    const columns = useMemo(() => {
        return [
            generateSelectColumDef<ServingPoint>(),
            ...convertColumnDataToColumn<ServingPoint, ServingPoint>(
                columnsDef,
                {
                    columnsOrder,
                    selectedColumns,
                },
            ),
            generateActionsColumDef({
                cell: ServingPointsRowActionsCell,
            }),
        ];
    }, [selectedColumns, columnsOrder, columnsDef]);


    const selectedRows = useMemo(() => {
        return servingPoints.filter((row) => rowSelection[row.id ?? row.name]);
    }, [servingPoints, rowSelection]);


    const resizeConfig = useMemo(
        () => ({
            enabled: true,
            columnSizing: columnsWidth,
            onColumnResize: setColumnsWidth,
        }),
        [columnsWidth, setColumnsWidth],
    );

    const sortConfig = useMemo(
        () => ({
            enabled: true,
            sorting: sortedColumns,
            setSorting: setSortedColumns,
        }),
        [sortedColumns, setSortedColumns]
    );

    const handleRowClick = useCallback(
        (row: ServingPoint) => {
            navigate({
                to: "/$workspaceName/debugging/connections/$serviceName",
                params: {
                    workspaceName,
                    serviceName: row.name,
                },
            });
        },
        [navigate, workspaceName],
    );

    if (isPending) {
        return <Loader />;
    }

    const noDataText = !search ? "No serving points registered" : "No search results";

    return (
        <div className="pt-6">
            <div className="mb-4 flex items-center justify-between">
                <h1 className="comet-title-l truncate break-words">Connections</h1>
            </div>

            <div className="mb-4 flex items-center justify-between gap-8">
                <SearchInput
                    searchText={search!}
                    setSearchText={setSearch}
                    placeholder="Search by name"
                    className="w-[320px]"
                    dimension="sm"
                />
                <div className="flex items-center gap-2">
                    <ServingPointsActionsPanel servingPoints={selectedRows} />
                    <Separator orientation="vertical" className="mx-2 h-4" />
                    <ColumnsButton
                        columns={columnsDef}
                        selectedColumns={selectedColumns}
                        onSelectionChange={setSelectedColumns}
                        order={columnsOrder}
                        onOrderChange={setColumnsOrder}
                    />
                </div>
            </div>

            <DataTable
                columns={columns}
                data={servingPoints}
                sortConfig={sortConfig}
                resizeConfig={resizeConfig}
                selectionConfig={{
                    rowSelection,
                    setRowSelection,
                }}
                getRowId={(row) => row.id || row.name}
                onRowClick={handleRowClick}
                columnPinning={DEFAULT_COLUMN_PINNING}
                noData={
                    <DataTableNoData title={noDataText} />
                }
            />
        </div>
    );
};

export default ServingPointsPage;
