package weather.app.roweather;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = {
        "weather.app.roweather",
        "controller",
        "service",
        "config",
        "model"
})
public class RoWeatherApplication {

    public static void main(String[] args) {
        SpringApplication.run(RoWeatherApplication.class, args);
    }

}