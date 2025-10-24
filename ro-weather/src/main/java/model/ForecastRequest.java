package model;

import jakarta.validation.constraints.NotBlank;

public record ForecastRequest(
        @NotBlank(message = "city is required") String city
) {}