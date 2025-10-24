package controller;

import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import model.ForecastResponse;
import service.WeatherService;

@Validated
@RestController
@RequestMapping("/api")
public class WeatherController {

    private final WeatherService service;

    public WeatherController(WeatherService service) {
        this.service = service;
    }

    @GetMapping("/forecast")
    public ResponseEntity<ForecastResponse> forecast(@RequestParam @NotBlank String city) {
        return ResponseEntity.ok(service.get7DayForecast(city.trim()));
    }

    @GetMapping("/ping")
    public String ping() { return "ok"; }
}
