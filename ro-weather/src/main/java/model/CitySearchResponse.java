package model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record CitySearchResponse(List<Result> results) {
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Result(
            String name,
            double latitude,
            double longitude,
            String country,
            String admin1,
            String timezone
    ) {}
}