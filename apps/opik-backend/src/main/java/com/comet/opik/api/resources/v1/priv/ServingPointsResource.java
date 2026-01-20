package com.comet.opik.api.resources.v1.priv;

import com.codahale.metrics.annotation.Timed;
import com.comet.opik.api.ServingPoint;
import com.comet.opik.domain.ServingPointService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.inject.Inject;
import jakarta.inject.Singleton;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.util.List;

@Slf4j
@Singleton
@Path("/v1/private/debug/connections")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Serving Points", description = "Serving Points resources")
@RequiredArgsConstructor(onConstructor_ = @Inject)
public class ServingPointsResource {

    private final ServingPointService servingPointService;

    @POST
    @Timed
    @Operation(operationId = "registerServingPoint", summary = "Register serving point", description = "Register a new serving point", responses = {
            @ApiResponse(responseCode = "201", description = "Serving point registered", content = @Content(schema = @Schema(implementation = ServingPoint.class)))
    })
    public Response register(@Valid @NotNull ServingPoint servingPoint) {
        log.info("Registering serving point: {}", servingPoint.getName());
        servingPointService.register(servingPoint);
        return Response.status(Response.Status.CREATED).build();
    }

    @DELETE
    @Path("/{name}")
    @Timed
    @Operation(operationId = "deregisterServingPoint", summary = "Deregister serving point", description = "Deregister an existing serving point", responses = {
            @ApiResponse(responseCode = "204", description = "Serving point deregistered")
    })
    public Response deregister(@PathParam("name") String name) {
        log.info("Deregistering serving point: {}", name);
        servingPointService.deregister(name);
        return Response.noContent().build();
    }

    @GET
    @Timed
    @Operation(operationId = "getServingPoints", summary = "Get serving points", description = "Get all registered serving points", responses = {
            @ApiResponse(responseCode = "200", description = "Serving points retrieved", content = @Content(schema = @Schema(implementation = ServingPoint.class)))
    })
    public Response getAll() {
        log.info("Getting all serving points");
        List<ServingPoint> servingPoints = servingPointService.getAll();
        return Response.ok(servingPoints).build();
    }
}
