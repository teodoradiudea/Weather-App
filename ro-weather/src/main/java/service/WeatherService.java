package service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import model.CitySearchResponse;
import model.ForecastResponse;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

@Service
public class WeatherService {

    private static final String GEOCODING =
            "https://geocoding-api.open-meteo.com/v1/search?name=%s&count=5&language=ro&format=json&country=RO";
    private static final String FORECAST =
            "https://api.open-meteo.com/v1/forecast?latitude=%s&longitude=%s"
                    + "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode,wind_speed_10m_max"
                    + "&timezone=%s&forecast_days=7";

    private final RestTemplate http = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();

    public CitySearchResponse.Result geocodeRomanianCity(String city) {
        try {
            String url = String.format(GEOCODING, encode(city));
            ResponseEntity<CitySearchResponse> resp =
                    http.getForEntity(new URI(url), CitySearchResponse.class);

            if (resp.getBody() == null || resp.getBody().results() == null || resp.getBody().results().isEmpty())
                throw new IllegalArgumentException("Orașul nu a fost găsit în România: " + city);

            // Prefer first matching result; avoid calling getFirst() on List (use get(0))
            return resp.getBody().results().stream()
                    .filter(r -> "Romania".equalsIgnoreCase(r.country()))
                    .findFirst()
                    .orElse(resp.getBody().results().get(0));
        } catch (Exception e) {
            throw new RuntimeException("Eroare la căutarea orașului: " + e.getMessage(), e);
        }
    }

    public ForecastResponse get7DayForecast(String city) {
        CitySearchResponse.Result geo = geocodeRomanianCity(city);

        String tz = (geo.timezone() != null && !geo.timezone().isBlank())
                ? geo.timezone()
                // fallback to a valid timezone id
                : ZoneId.of("Europe/Bucharest").getId();

        String url = String.format(FORECAST, geo.latitude(), geo.longitude(), encode(tz));

        try {
            ResponseEntity<String> resp = http.getForEntity(new URI(url), String.class);
            if (!resp.getStatusCode().is2xxSuccessful() || resp.getBody() == null) {
                throw new RuntimeException("Open-Meteo a returnat un răspuns invalid");
            }

            JsonNode root = mapper.readTree(resp.getBody());
            JsonNode daily = root.path("daily");
            JsonNode dates = daily.path("time");
            JsonNode tMin = daily.path("temperature_2m_min");
            JsonNode tMax = daily.path("temperature_2m_max");
            JsonNode precip = daily.path("precipitation_sum");
            JsonNode codes = daily.path("weathercode");
            JsonNode wind = daily.path("wind_speed_10m_max");

            List<ForecastResponse.Daily> out = new ArrayList<>();
            for (int i = 0; i < dates.size(); i++) {
                String d = dates.get(i).asText();
                Double min = getDouble(tMin, i);
                Double max = getDouble(tMax, i);
                Double pr  = getDouble(precip, i);
                Integer wc = getInt(codes, i);
                Double wmx = getDouble(wind, i);
                out.add(new ForecastResponse.Daily(d, min, max, pr, wc, wmx));
            }

            return new ForecastResponse(
                    geo.name(),
                    geo.latitude(),
                    geo.longitude(),
                    tz,
                    out
            );
        } catch (Exception e) {
            throw new RuntimeException("Eroare la preluarea prognozei: " + e.getMessage(), e);
        }
    }

    private static String encode(String s) {
        return java.net.URLEncoder.encode(s, java.nio.charset.StandardCharsets.UTF_8);
    }
    private static Double getDouble(JsonNode arr, int idx) {
        return (arr.has(idx) && !arr.get(idx).isNull()) ? arr.get(idx).asDouble() : null;
    }
    private static Integer getInt(JsonNode arr, int idx) {
        return (arr.has(idx) && !arr.get(idx).isNull()) ? arr.get(idx).asInt() : null;
    }
}