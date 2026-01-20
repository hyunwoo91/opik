package com.comet.opik.domain;

import com.comet.opik.api.ServingPoint;
import com.comet.opik.infrastructure.db.UUIDArgumentFactory;
import org.jdbi.v3.sqlobject.config.RegisterArgumentFactory;
import org.jdbi.v3.sqlobject.config.RegisterConstructorMapper;
import org.jdbi.v3.sqlobject.customizer.BindBean;
import org.jdbi.v3.sqlobject.customizer.Bind;
import org.jdbi.v3.sqlobject.statement.SqlQuery;
import org.jdbi.v3.sqlobject.statement.SqlUpdate;

import java.util.List;
import java.util.UUID;

@RegisterConstructorMapper(ServingPoint.class)
@RegisterArgumentFactory(UUIDArgumentFactory.class)
public interface ServingPointDAO {

    @SqlUpdate("INSERT INTO serving_points (id, workspace_id, name, url, type, target_as, created_by, last_updated_by) " +
            "VALUES (:bean.id, :workspaceId, :bean.name, :bean.url, :bean.type, :bean.targetAs, :bean.createdBy, :bean.lastUpdatedBy)")
    void save(@Bind("workspaceId") String workspaceId, @BindBean("bean") ServingPoint servingPoint);

    @SqlUpdate("DELETE FROM serving_points WHERE workspace_id = :workspaceId AND name = :name")
    void delete(@Bind("workspaceId") String workspaceId, @Bind("name") String name);

    @SqlQuery("SELECT * FROM serving_points WHERE workspace_id = :workspaceId AND name = :name")
    ServingPoint findByName(@Bind("workspaceId") String workspaceId, @Bind("name") String name);

    @SqlQuery("SELECT * FROM serving_points WHERE workspace_id = :workspaceId")
    List<ServingPoint> findAll(@Bind("workspaceId") String workspaceId);
}
