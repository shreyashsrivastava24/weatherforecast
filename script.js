const API_KEY = "ded36622456d3eed4c43056a4c002609";
const WEATHER_API = `https://api.openweathermap.org/data/2.5/weather?appid=${API_KEY}&units=metric&q=`;
const FORECAST_API = `https://api.openweathermap.org/data/2.5/forecast?appid=${API_KEY}&units=metric&q=`;
const UV_API = `https://api.openweathermap.org/data/2.5/uvi?appid=${API_KEY}&`;

const userLocation = document.getElementById("userLocation");
const converter = document.getElementById("converter");
const Forecast = document.querySelector(".Forecast");
const weatherIcon = document.querySelector(".weatherIcon");
const date = document.querySelector(".date");
const temperature = document.querySelector(".temperature");
const feelsLike = document.querySelector(".feelsLike");
const description = document.querySelector(".description");
const city = document.querySelector(".city");
const HValue = document.getElementById("HValue");
const WValue = document.getElementById("WValue");
const SRValue = document.getElementById("SRValue");
const SSValue = document.getElementById("SSValue");
const CValue = document.getElementById("CValue");
const UVValue = document.getElementById("UVValue");
const PValue = document.getElementById("PValue");
const planner = document.querySelector(".planner");
const leftForecastStrip = document.getElementById("leftForecastStrip");

// Auto Load
// run findUserLocation only after full page loads (so DOM elements exist)
window.onload = findUserLocation;

// Main Function
async function findUserLocation() {
  try {
    //clear old
    Forecast.innerHTML = "";
    if (leftForecastStrip) leftForecastStrip.innerHTML = "";

    const cityName = userLocation.value;

    // current weather
    const res = await fetch(WEATHER_API + cityName);
    const data = await res.json();
    console.log(data);

    if (data.cod !== 200 && data.cod !== "200") {
      //message openapi hi de rhi
      alert(data.message);
      //stop the execution
      return;
    }

    updateMainWeather(data);
    getUVIndex(data);
    getForecast(cityName);
  } catch (err) {
    console.error("Error:", err);
  }
}

// Main Weather UI update
function updateMainWeather(data) {
  city.innerHTML = `${data.name}, ${data.sys.country}`;

  weatherIcon.style.background = `url(https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png)`;

  temperature.innerHTML = TemperatureConverter(data.main.temp);

  // "Date ko kaise show karna hai".
  const options = {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  };
  // new Date()            -> abhi ki current date/time
  // toLocaleDateString()  -> readable format me convert (options use karke)
  // date.innerHTML        -> .date div me text insert
  date.innerHTML = new Date().toLocaleDateString("en-US", options);

  feelsLike.innerHTML = "Feels like " + TemperatureConverter(data.main.feels_like);

  description.innerHTML =
    `<i class="fa-brands fa-cloudversify"></i> &nbsp;` + data.weather[0].description;

  // Highlights
  HValue.innerHTML = data.main.humidity + `<span>%</span>`;
  WValue.innerHTML = Math.round(data.wind.speed) + `<span>m/s</span>`;
  PValue.innerHTML = data.main.pressure + `<span>hPa</span>`;
  //use if data.cloud exists
  CValue.innerHTML = data.clouds ? data.clouds.all + `<span>%</span>` : "N/A";

  // Sunrise / Sunset
  //   API -> timestamp number
  //       |
  // *1000 -> milliseconds
  //       |
  // new Date() -> time object
  //       |
  // toLocaleTimeString() -> readable time
  //       |
  // innerHTML -> screen pe show
  const sunrise = new Date(data.sys.sunrise * 1000);
  const sunset = new Date(data.sys.sunset * 1000);

  const timeOptions = { hour: "numeric", minute: "numeric", hour12: true };
  SRValue.innerHTML = sunrise.toLocaleTimeString("en-US", timeOptions);
  SSValue.innerHTML = sunset.toLocaleTimeString("en-US", timeOptions);
}

async function getUVIndex(data) {
  try {
    const res = await fetch(`${UV_API}lat=${data.coord.lat}&lon=${data.coord.lon}`);
    const uvData = await res.json();
    UVValue.innerHTML = Math.round(uvData.value);

    // Update planner
    updatePlanner(data, uvData.value);
  } catch {
    UVValue.innerHTML = "N/A";

    // Update planner with no UV
    updatePlanner(data, null);
  }
}

function updatePlanner(data, uvIndex) {
  let suggestion = "";
  let iconClass = "";
  const temp = data.main.temp;
  const weatherDesc = data.weather[0].description.toLowerCase();

  if (uvIndex !== null && temp > 35 && uvIndex > 7) {
    suggestion = "Avoid Direct Sun";
    iconClass = "fa-sun";
  } else if (temp > 30) {
    suggestion = "Stay Hydrated";
    iconClass = "fa-glass-water";
  } else if (temp < 10) {
    suggestion = "Light Jacket Recommended";
    iconClass = "fa-shirt";
  } else if (uvIndex !== null && uvIndex > 7) {
    suggestion = "High UV - Sunscreen Needed";
    iconClass = "fa-sun";
  } else if (weatherDesc.includes("rain") || weatherDesc.includes("drizzle")) {
    suggestion = "Carry Umbrella";
    iconClass = "fa-umbrella";
  } else {
    suggestion = "Enjoy the Weather!";
    iconClass = "fa-smile";
  }

  planner.innerHTML = `
    <div class="planner-icon">
      <i class="fa-solid ${iconClass}"></i>
    </div>
    <div class="planner-text">${suggestion}</div>
  `;
}

async function getForecast(cityName) {
  try {
    const res = await fetch(FORECAST_API + cityName);
    const forecastData = await res.json();
    console.log(forecastData);

    renderLeftForecastStrip(forecastData.list);

    const daily = {};

    forecastData.list.forEach((item) => {
      const d = new Date(item.dt * 1000).toDateString();

      if (!daily[d]) {
        daily[d] = {
          temps: [],
          weather: item.weather[0],
          dt: item.dt,
        };
      }

      daily[d].temps.push(item.main.temp);
    });

    Object.keys(daily)
      .slice(0, 5)
      .forEach((key) => createForecastCard(daily[key]));
  } catch (err) {
    console.error("Forecast error:", err);
  }
}

function renderLeftForecastStrip(list) {
  if (!leftForecastStrip) return;

  const upcoming = list.slice(0, 5);
  leftForecastStrip.innerHTML = "";

  upcoming.forEach((item) => {
    const timeLabel = new Date(item.dt * 1000).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const stripItem = document.createElement("div");
    stripItem.className = "strip-item";
    stripItem.innerHTML = `
      <p class="strip-time">${timeLabel}</p>
      <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png" alt="${item.weather[0].description}"/>
      <p class="strip-temp">${TemperatureConverter(item.main.temp)}</p>
    `;

    leftForecastStrip.append(stripItem);
  });
}

function createForecastCard(dayData) {
  //...spread operator h jo array ko tod tod k individual values bna deta
  const maxTemp = Math.max(...dayData.temps);
  const minTemp = Math.min(...dayData.temps);

  const div = document.createElement("div");

  const options = {
    weekday: "long",
    month: "long",
    day: "numeric",
  };

  const dailyDate = new Date(dayData.dt * 1000).toLocaleDateString("en-US", options);

  div.innerHTML = `
    ${dailyDate}
    <img src="https://openweathermap.org/img/wn/${dayData.weather.icon}@2x.png"/>
    <p class="forecast-desc">${dayData.weather.description}</p>
    <span>
      <span>${TemperatureConverter(maxTemp)}</span>
      &nbsp;&nbsp;
      <span>${TemperatureConverter(minTemp)}</span>
    </span>
  `;

  Forecast.append(div);
}

function TemperatureConverter(temp) {
  const cTemp = Math.round(temp);

  if (converter.value === "°C") {
    return `${cTemp} <span>°C</span>`;
  }

  const fTemp = (cTemp * 9) / 5 + 32;
  return `${fTemp} <span>°F</span>`;
}
