package com.octopus.lambda;

import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * An interface used to extract values from a Lambda request.
 */
public interface LambdaHttpHeaderExtractor {

  /**
   * Get a single value from both the multi and single collections.
   *
   * @param input The Lambda request inputs.
   * @param name The name of the value.
   * @return All the values that match the name.
   */
  Optional<String> getHeaderParam(APIGatewayProxyRequestEvent input, String name);

  /**
   * Get all values from both the multi and single collections.
   *
   * @param input The Lambda request inputs.
   * @param name The name of the value.
   * @return All the  values that match the name.
   */
  List<String> getAllHeaderParams(APIGatewayProxyRequestEvent input, String name);

  /**
   * Get all values from both the multi and single collections.
   *
   * @param multiHeader The collection holding multiple values.
   * @param Header The collection holding single values.
   * @param name The name of the value.
   * @return All the  values that match the name.
   */
  List<String> getAllHeaderParams(Map<String, List<String>> multiHeader, Map<String, String> Header, String name);

  /**
   * Get all the values from the multi Header collection.
   *
   * @param Header The collection holding multiple values.
   * @param name The name of the value.
   * @return All the values that match the name.
   */
  List<String> getMultiHeader(Map<String, List<String>> Header, String name);

  /**
   * Get the value from the single Header collection.
   *
   * @param Header The collection holding single values.
   * @param name The name of the value.
   * @return A list with zero or one values that match the name.
   */
  List<String> getHeader(Map<String, String> Header, String name);
}
