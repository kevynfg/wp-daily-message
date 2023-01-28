const request = require('request-promise');
const axios = require('axios'); 

const getWeather = async (city = null, days = 1, alerts = 'no') => {
    const { DEFAULT_WEATHER_API_URL_REQUEST = null, WEATHER_API_URL, WEATHER_API_KEY } = process.env;
    
    if (!WEATHER_API_KEY) throw Error("Invalid Weather API Key or set one");
    
    const defaultWeatherRequest = WEATHER_API_URL;
    
    const weatherResponse = await request.get({
        method: 'GET',
        uri: `${DEFAULT_WEATHER_API_URL_REQUEST ?? defaultWeatherRequest}?key=${WEATHER_API_KEY}&q=${city ?? 'Brazil'}&days=${days}&aqi=no&alerts=${alerts}`,
        timeout: 2000000,
        rejectUnauthorized: false,
        json: true
    });
    if (weatherResponse && weatherResponse.forecast) {
        const dailyForecast = await makeForecastData(weatherResponse);
        return dailyForecast;
    }

    return null;
};

const makeForecastData = async(weatherResponse) => {
    if (weatherResponse?.forecast?.forecastday.length) {
        const [currentDayForecast] = weatherResponse?.forecast?.forecastday;
        const conditionList = await makeWeatherConditionListPTBR();
        if (currentDayForecast?.day) {
            const conditionText = conditionList.find(({code}) => currentDayForecast.day.condition.code === code);
            const dailyWeather = {
                date: currentDayForecast.date,
                day: {
                    maxtemp: currentDayForecast.day.maxtemp_c,
                    mintemp: currentDayForecast.day.mintemp_c,
                    condition: conditionText.language.day_text ?? "Condição não disponível"
                }
            }
            return dailyWeather;
        }
    }
    return null
}

const makeWeatherConditionListPTBR = async () => {
   try {
        const response = await axios.get("https://www.weatherapi.com/docs/conditions.json")
        .then((resp) => resp.data);
        if (response && response.length) {
            const mappedList = response.map(({code, day, languages}) => {
                return {
                    code,
                    day,
                    language: languages.find(({lang_iso}) => lang_iso === 'pt')
                }
            })
            return mappedList;
        }
        return [];
   } catch (error) {
        console.error('Weather api service', error)
   }
}

module.exports.getWeather = getWeather;