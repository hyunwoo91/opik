package com.comet.opik.domain;

import com.comet.opik.api.ServingPoint;
import com.comet.opik.infrastructure.auth.RequestContext;
import jakarta.inject.Inject;
import jakarta.inject.Provider;
import jakarta.inject.Singleton;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ru.vyarus.guicey.jdbi3.tx.TransactionTemplate;

import com.comet.opik.api.error.EntityAlreadyExistsException;
import com.comet.opik.api.error.ErrorMessage;
import java.sql.SQLIntegrityConstraintViolationException;
import org.jdbi.v3.core.statement.UnableToExecuteStatementException;

import java.util.List;
import java.util.UUID;

import static com.comet.opik.infrastructure.db.TransactionTemplateAsync.READ_ONLY;
import static com.comet.opik.infrastructure.db.TransactionTemplateAsync.WRITE;

import java.util.List;
import java.util.UUID;

@Slf4j
@Singleton
@RequiredArgsConstructor(onConstructor_ = @Inject)
public class ServingPointService {

    private final @NonNull Provider<RequestContext> requestContextProvider;
    private final @NonNull TransactionTemplate template;

    public void register(ServingPoint servingPoint) {
        String workspaceId = requestContextProvider.get().getWorkspaceId();
        String userName = requestContextProvider.get().getUserName();

        ServingPoint newServingPoint = servingPoint.toBuilder()
                .id(UUID.randomUUID())
                .createdBy(userName)
                .lastUpdatedBy(userName)
                .build();

        try {
            template.inTransaction(WRITE, handle -> {
                handle.attach(ServingPointDAO.class).save(workspaceId, newServingPoint);
                return null;
            });
        } catch (UnableToExecuteStatementException e) {
            if (e.getCause() instanceof SQLIntegrityConstraintViolationException) {
                throw new EntityAlreadyExistsException(new ErrorMessage(List.of("Serving point already exists")));
            } else {
                throw e;
            }
        }
        log.info("Registered serving point: {} in workspace: {}", servingPoint.getName(), workspaceId);
    }

    public void deregister(String name) {
        String workspaceId = requestContextProvider.get().getWorkspaceId();
        template.inTransaction(WRITE, handle -> {
            handle.attach(ServingPointDAO.class).delete(workspaceId, name);
            return null;
        });
        log.info("Deregistered serving point: {} in workspace: {}", name, workspaceId);
    }

    public ServingPoint get(String name) {
        String workspaceId = requestContextProvider.get().getWorkspaceId();
        return template.inTransaction(READ_ONLY,
                handle -> handle.attach(ServingPointDAO.class).findByName(workspaceId, name));
    }

    public List<ServingPoint> getAll() {
        String workspaceId = requestContextProvider.get().getWorkspaceId();
        return template.inTransaction(READ_ONLY, handle -> handle.attach(ServingPointDAO.class).findAll(workspaceId));
    }
}
