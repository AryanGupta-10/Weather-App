document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const cityInput = document.getElementById('city-input');
    const searchBtn = document.getElementById('search-btn');
    
    const loadingState = document.getElementById('loading');
    const errorState = document.getElementById('error-message');
    const weatherContent = document.getElementById('weather-content');
    
    // Weather Data Elements
    const cityNameEl = document.getElementById('city-name');
    const dateTimeEl = document.getElementById('date-time');
    const temperatureEl = document.getElementById('temperature');
    const conditionEl = document.getElementById('condition');
    const weatherIconEl = document.getElementById('weather-icon');
    const humidityEl = document.getElementById('humidity');
    const windSpeedEl = document.getElementById('wind-speed');
    const pressureEl = document.getElementById('pressure');
    const visibilityEl = document.getElementById('visibility');

    const defaultCity = 'Tokyo';

    // Initialize
    fetchWeather(defaultCity);

    // Event Listeners
    searchBtn.addEventListener('click', () => {
        const city = cityInput.value.trim();
        if (city) {
            fetchWeather(city);
        }
    });

    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const city = cityInput.value.trim();
            if (city) {
                fetchWeather(city);
            }
        }
    });

    // API Fetch using Open-Meteo (No API Key Required)
    async function fetchWeather(city) {
        showLoading();

        try {
            // 1. Geocode city name to get lat/lon
            const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
            if (!geoRes.ok) throw new Error('Geocoding failed');
            
            const geoData = await geoRes.json();
            if (!geoData.results || geoData.results.length === 0) {
                throw new Error('City not found');
            }

            const { latitude, longitude, name, country } = geoData.results[0];

            // 2. Fetch weather data using lat/lon
            const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,surface_pressure&timezone=auto`);
            if (!weatherRes.ok) throw new Error('Weather fetch failed');

            const weatherData = await weatherRes.json();
            
            updateUI(name, country, weatherData.current);
            hideLoading(true);
        } catch (error) {
            console.error(error);
            document.getElementById('error-text').innerText = 'City not found. Please try again.';
            hideLoading(false);
        }
    }

    // Map WMO Weather codes to descriptions and OpenWeather icons (for visual consistency)
    function getWeatherDetails(code, isDay) {
        const dayNight = isDay ? 'd' : 'n';
        const map = {
            0: { desc: 'Clear sky', icon: `01${dayNight}` },
            1: { desc: 'Mainly clear', icon: `02${dayNight}` },
            2: { desc: 'Partly cloudy', icon: `03${dayNight}` },
            3: { desc: 'Overcast', icon: `04${dayNight}` },
            45: { desc: 'Fog', icon: `50${dayNight}` },
            48: { desc: 'Depositing rime fog', icon: `50${dayNight}` },
            51: { desc: 'Light drizzle', icon: `09${dayNight}` },
            53: { desc: 'Moderate drizzle', icon: `09${dayNight}` },
            55: { desc: 'Dense drizzle', icon: `09${dayNight}` },
            61: { desc: 'Slight rain', icon: `10${dayNight}` },
            63: { desc: 'Moderate rain', icon: `10${dayNight}` },
            65: { desc: 'Heavy rain', icon: `10${dayNight}` },
            71: { desc: 'Slight snow', icon: `13${dayNight}` },
            73: { desc: 'Moderate snow', icon: `13${dayNight}` },
            75: { desc: 'Heavy snow', icon: `13${dayNight}` },
            77: { desc: 'Snow grains', icon: `13${dayNight}` },
            80: { desc: 'Slight rain showers', icon: `09${dayNight}` },
            81: { desc: 'Moderate rain showers', icon: `09${dayNight}` },
            82: { desc: 'Violent rain showers', icon: `09${dayNight}` },
            85: { desc: 'Snow showers slight', icon: `13${dayNight}` },
            86: { desc: 'Snow showers heavy', icon: `13${dayNight}` },
            95: { desc: 'Thunderstorm', icon: `11${dayNight}` },
            96: { desc: 'Thunderstorm slight hail', icon: `11${dayNight}` },
            99: { desc: 'Thunderstorm heavy hail', icon: `11${dayNight}` },
        };

        return map[code] || { desc: 'Unknown', icon: `01${dayNight}` };
    }

    // UI Updates
    function updateUI(city, country, current) {
        // Update basic info
        cityNameEl.innerText = `${city}, ${country || ''}`.replace(/,\s*$/, "");
        temperatureEl.innerText = Math.round(current.temperature_2m);
        
        const weatherInfo = getWeatherDetails(current.weather_code, current.is_day);
        conditionEl.innerText = weatherInfo.desc;
        
        // Update details
        humidityEl.innerText = `${current.relative_humidity_2m}%`;
        windSpeedEl.innerText = `${Math.round(current.wind_speed_10m)} km/h`;
        pressureEl.innerText = `${Math.round(current.surface_pressure)} hPa`;
        
        // Open-Meteo doesn't provide direct visibility in 'current', using apparent temp as a placeholder for premium feel
        visibilityEl.innerText = `${Math.round(current.apparent_temperature)}°C Feels`;
        document.querySelector('#visibility').parentElement.querySelector('.detail-label').innerText = 'Feels Like';
        document.querySelector('#visibility').parentElement.parentElement.querySelector('i').className = 'ri-temp-hot-line';

        // Update Date
        const date = new Date();
        const options = { weekday: 'long', day: 'numeric', month: 'short' };
        dateTimeEl.innerText = date.toLocaleDateString('en-US', options);

        // Update Icon
        weatherIconEl.src = `https://openweathermap.org/img/wn/${weatherInfo.icon}@4x.png`;
    }

    function showLoading() {
        loadingState.classList.remove('hidden');
        errorState.classList.add('hidden');
        weatherContent.classList.add('hidden');
    }

    function hideLoading(success) {
        loadingState.classList.add('hidden');
        if (success) {
            weatherContent.classList.remove('hidden');
            errorState.classList.add('hidden');
        } else {
            weatherContent.classList.add('hidden');
            errorState.classList.remove('hidden');
        }
    }
});
