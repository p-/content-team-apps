package com.octopus.github.builders.actions;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.octopus.githubactions.builders.DotNetCoreBuilder;
import com.octopus.githubactions.builders.JavaMavenBuilder;
import com.octopus.http.ReadOnlyStringReadOnlyHttpClient;
import com.octopus.repoclients.GithubRepoClient;
import org.junit.jupiter.api.Test;

public class DotNetBuilderTest {

  private static final DotNetCoreBuilder DOT_NET_CORE_BUILDER = new DotNetCoreBuilder();

  @Test
  public void verifyBuilderSupport() {
    assertFalse(DOT_NET_CORE_BUILDER.canBuild(GithubRepoClient
        .builder()
        .readOnlyHttpClient(new ReadOnlyStringReadOnlyHttpClient())
        .repo("https://github.com/OctopusSamples/RandomQuotes")
        .username(System.getenv("APP_GITHUB_ID"))
        .password(System.getenv("APP_GITHUB_SECRET"))
        .build()));

    assertTrue(DOT_NET_CORE_BUILDER.canBuild(GithubRepoClient
        .builder()
        .readOnlyHttpClient(new ReadOnlyStringReadOnlyHttpClient())
        .repo("https://github.com/OctopusSamples/RandomQuotes")
        .username(System.getenv("APP_GITHUB_ID"))
        .password(System.getenv("APP_GITHUB_SECRET"))
        .build()));
  }
}
