package com.octopus.octopub.infrastructure.repositories;

import com.github.tennaito.rsql.jpa.JpaPredicateVisitor;
import com.octopus.octopub.domain.entities.Audit;
import com.octopus.octopub.domain.exceptions.InvalidInput;
import cz.jirutka.rsql.parser.RSQLParser;
import cz.jirutka.rsql.parser.ast.Node;
import cz.jirutka.rsql.parser.ast.RSQLVisitor;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import javax.persistence.EntityManager;
import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.From;
import javax.persistence.criteria.Predicate;
import javax.validation.ConstraintViolation;
import javax.validation.Validator;
import lombok.NonNull;
import org.h2.util.StringUtils;

/**
 * Repositories are the interface between the application and the data store. They don't contain any
 * business logic, security rules, or manual audit logging. Note though that we use Envers to
 * automatically track database changes.
 */
@ApplicationScoped
public class AuditRepository {

  @Inject EntityManager em;

  @Inject Validator validator;

  /**
   * Get a single entity.
   *
   * @param id The ID of the entity to update.
   * @return The entity.
   */
  public Audit findOne(final int id) {
    final Audit audit = em.find(Audit.class, id);
    /*
     We don't expect any local code to modify the entity returned here. Any changes will be done by
     returning the entity to a client, the client makes the appropriate updates, and the updated
     entity is sent back with a new request.

     To prevent the entity from being accidentally updated, we detach it from the context.
     */
    if (audit != null) {
      em.detach(audit);
    }
    return audit;
  }

  /**
   * Returns all matching entities.
   *
   * @param partitions The partitions that entities can be found in.
   * @param filter The RSQL filter used to query the entities.
   * @return The matching entities.
   */
  public List<Audit> findAll(@NonNull final List<String> partitions, final String filter) {

    final CriteriaBuilder builder = em.getCriteriaBuilder();
    final CriteriaQuery<Audit> criteria = builder.createQuery(Audit.class);
    final From<Audit, Audit> root = criteria.from(Audit.class);

    // add the partition search rules
    final Predicate partitionPredicate =
        builder.or(
            partitions.stream()
                .map(p -> builder.equal(root.get("dataPartition"), p))
                .collect(Collectors.toList())
                .toArray(new Predicate[0]));

    if (!StringUtils.isNullOrEmpty(filter)) {
      /*
       Makes use of RSQL queries to filter any responses:
       https://github.com/jirutka/rsql-parser
      */
      final RSQLVisitor<Predicate, EntityManager> visitor =
          new JpaPredicateVisitor<Audit>().defineRoot(root);
      final Node rootNode = new RSQLParser().parse(filter);
      final Predicate filterPredicate = rootNode.accept(visitor, em);

      // combine with the filter rules
      final Predicate combinedPredicate = builder.and(partitionPredicate, filterPredicate);

      criteria.where(combinedPredicate);
    } else {
      criteria.where(partitionPredicate);
    }

    final List<Audit> results = em.createQuery(criteria).getResultList();

    // detach all the entities
    em.clear();

    return results;
  }

  /**
   * Saves a new audit in the data store.
   *
   * @param audit The audit to save.
   * @return The newly created entity.
   */
  public Audit save(@NonNull final Audit audit) {
    audit.id = null;

    validateEntity(audit);

    em.persist(audit);
    em.flush();
    return audit;
  }

  private void validateEntity(@NonNull final Audit audit) {
    final Set<ConstraintViolation<Audit>> violations = validator.validate(audit);
    if (violations.isEmpty()) {
      return;
    }

    throw new InvalidInput(
        violations.stream().map(cv -> cv.getMessage()).collect(Collectors.joining(", ")));
  }
}
