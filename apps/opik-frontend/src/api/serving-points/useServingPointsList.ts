import { QueryFunctionContext, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api, { SERVING_POINTS_REST_ENDPOINT } from "@/api/api";
import { ServingPoint } from "@/types/serving-points";

const SERVING_POINTS_KEY = "serving-points";

export const getServingPoints = async (
    {
        signal,
    }: QueryFunctionContext<[string, string]>,
) => {
    const { data } = await api.get<ServingPoint[]>(
        SERVING_POINTS_REST_ENDPOINT,
        {
            signal,
        },
    );

    return data;
};

export const useServingPointsList = (options: {
    enabled?: boolean;
}) => {
    return useQuery({
        queryKey: [SERVING_POINTS_KEY],
        queryFn: getServingPoints,
        ...options,
    });
};

export const useServingPointDeleteMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (name: string) => {
            await api.delete(`${SERVING_POINTS_REST_ENDPOINT}/${name}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [SERVING_POINTS_KEY] });
        },
    });
};
