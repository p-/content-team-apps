package com.octopus.octopub.domain.framework.config;

import com.github.jasminb.jsonapi.IntegerIdHandler;
import com.github.jasminb.jsonapi.StringIdHandler;
import com.octopus.octopub.domain.entities.Audit;
import com.octopus.octopub.domain.entities.Health;
import io.quarkus.runtime.annotations.RegisterForReflection;

/**
 * This class is used to configure which other classes must be included in the native image intact.
 * Otherwise the native compilation will strip out unreferenced methods, which can cause issues with
 * reflection.
 */
@RegisterForReflection(
    targets = {StringIdHandler.class, Audit.class, Health.class, Audit.class, IntegerIdHandler.class})
public class MyReflectionConfiguration {}
