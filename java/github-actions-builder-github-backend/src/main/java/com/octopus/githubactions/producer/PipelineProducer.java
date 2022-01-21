package com.octopus.githubactions.producer;

import com.octopus.builders.PipelineBuilder;
import com.octopus.githubactions.builders.DotNetCoreBuilder;
import com.octopus.githubactions.builders.GenericBuilder;
import com.octopus.githubactions.builders.GoBuilder;
import com.octopus.githubactions.builders.JavaGradleBuilder;
import com.octopus.githubactions.builders.JavaMavenBuilder;
import com.octopus.githubactions.builders.NodeJsBuilder;
import com.octopus.githubactions.builders.PhpComposerBuilder;
import com.octopus.githubactions.builders.PythonBuilder;
import com.octopus.githubactions.builders.RubyBuilder;
import com.octopus.http.HttpClient;
import com.octopus.http.StringHttpClient;
import com.octopus.repoclients.GithubRepoClient;
import com.octopus.repoclients.RepoClient;
import java.util.Optional;
import javax.enterprise.context.ApplicationScoped;
import javax.enterprise.inject.Produces;
import org.eclipse.microprofile.config.inject.ConfigProperty;

/**
 * Generates CDI beans to be used in the pipeline generation. Be aware the not all scopes are used
 * by all end points. For example, @RequestScoped doesn't work with Lambdas.
 */
@ApplicationScoped
public class PipelineProducer {

  @ConfigProperty(name = "application.github-client-id", defaultValue = "")
  Optional<String> clientId;

  @ConfigProperty(name = "application.github-client-secret", defaultValue = "")
  Optional<String> clientSecret;

  /**
   * Produces the HTTP client.
   *
   * @return An implementation of HttpClient.
   */
  @ApplicationScoped
  @Produces
  public HttpClient getHttpClient() {
    return new StringHttpClient();
  }

  /**
   * Produces the repository accessor.
   *
   * @return An implementation of RepoAccessor.
   */
  @Produces
  public RepoClient getRepoAccessor(final HttpClient httpClient) {
    return GithubRepoClient.builder()
        .httpClient(httpClient)
        .username(clientId.orElse(""))
        .password(clientSecret.orElse(""))
        .build();
  }

  /**
   * Produces the Maven pipeline builder.
   *
   * @return An implementation of PipelineBuilder.
   */
  @ApplicationScoped
  @Produces
  public PipelineBuilder getMavenBuilder() {
    return new JavaMavenBuilder();
  }

  /**
   * Produces the Gradle pipeline builder.
   *
   * @return An implementation of PipelineBuilder.
   */
  @ApplicationScoped
  @Produces
  public PipelineBuilder getGradleBuilder() {
    return new JavaGradleBuilder();
  }

  /**
   * Produces the Node.js pipeline builder.
   *
   * @return An implementation of PipelineBuilder.
   */
  @ApplicationScoped
  @Produces
  public PipelineBuilder getNodeJsBuilder() {
    return new NodeJsBuilder();
  }

  /**
   * Produces the PHP pipeline builder.
   *
   * @return An implementation of PipelineBuilder.
   */
  @ApplicationScoped
  @Produces
  public PipelineBuilder getPhpBuilder() {
    return new PhpComposerBuilder();
  }

  /**
   * Produces the Python pipeline builder.
   *
   * @return An implementation of PipelineBuilder.
   */
  @ApplicationScoped
  @Produces
  public PipelineBuilder getPythonBuilder() {
    return new PythonBuilder();
  }

  /**
   * Produces the Go pipeline builder.
   *
   * @return An implementation of PipelineBuilder.
   */
  @ApplicationScoped
  @Produces
  public PipelineBuilder getGoBuilder() {
    return new GoBuilder();
  }

  /**
   * Produces the Ruby pipeline builder.
   *
   * @return An implementation of PipelineBuilder.
   */
  @ApplicationScoped
  @Produces
  public PipelineBuilder getRubyBuilder() {
    return new RubyBuilder();
  }

  /**
   * Produces the DotNET Core pipeline builder.
   *
   * @return An implementation of PipelineBuilder.
   */
  @ApplicationScoped
  @Produces
  public PipelineBuilder getDotNetCore() {
    return new DotNetCoreBuilder();
  }

  /**
   * Produces the generic pipeline builder.
   *
   * @return An implementation of PipelineBuilder.
   */
  @ApplicationScoped
  @Produces
  public PipelineBuilder getGeneric() {
    return new GenericBuilder();
  }
}
