package com.octopus.githubrepo.domain.framework.producers;

import com.github.jasminb.jsonapi.DeserializationFeature;
import com.github.jasminb.jsonapi.ResourceConverter;
import com.github.jasminb.jsonapi.SerializationFeature;
import com.octopus.githubrepo.domain.entities.CreateGithubRepo;
import com.octopus.githubrepo.domain.entities.GenerateTemplate;
import com.octopus.githubrepo.domain.entities.Health;
import javax.enterprise.inject.Produces;

/**
 * Produces a JSONAPI resource converter.
 */
public class JsonApiConverter {

  /**
   * Produces a ResourceConverter.
   *
   * @return The configured ResourceConverter.
   */
  @Produces
  public ResourceConverter buildResourceConverter() {
    final ResourceConverter resourceConverter = new ResourceConverter(
        CreateGithubRepo.class,
        GenerateTemplate.class,
        Health.class);
    resourceConverter.disableDeserializationOption(DeserializationFeature.REQUIRE_RESOURCE_ID);
    resourceConverter.enableDeserializationOption(DeserializationFeature.ALLOW_UNKNOWN_INCLUSIONS);
    resourceConverter.enableSerializationOption(SerializationFeature.INCLUDE_RELATIONSHIP_ATTRIBUTES);
    return resourceConverter;
  }
}
