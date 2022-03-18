package com.octopus.customers.application.http;

import static io.restassured.RestAssured.given;

import com.octopus.customers.BaseTest;
import com.octopus.customers.application.Paths;
import com.octopus.customers.infrastructure.utilities.LiquidbaseUpdater;
import io.quarkus.test.junit.QuarkusTest;
import java.sql.SQLException;
import javax.inject.Inject;
import liquibase.exception.LiquibaseException;
import lombok.NonNull;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

@QuarkusTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public class HttpHealthTest extends BaseTest {
  
  @Inject
  LiquidbaseUpdater liquidbaseUpdater;

  @BeforeAll
  public void setup() throws SQLException, LiquibaseException {
    liquidbaseUpdater.update();
  }

  @ParameterizedTest
  @ValueSource(
      strings = {
          Paths.HEALTH_ENDPOINT + "/GET",
          Paths.HEALTH_ENDPOINT + "/POST",
          Paths.HEALTH_ENDPOINT + "/x/GET"
      })
  public void testCreateAndGetResource(@NonNull final String path) {
    given().when().get(path).then().statusCode(200);
  }
}
