package model;

import java.util.List;

public record ForecastResponse(
        String city,
        double latitude,
        double longitude,
        String timezone,
        List<Daily> daily
) {
    public record Daily(
            String date,
            Double tMin,
            Double tMax,
            Double precipMm,
            Integer weatherCode,
            Double windMaxKph
    ) {}
}
