import {
  Component,
  OnInit,
  OnDestroy,
  DoCheck,
  AfterViewInit,
} from '@angular/core';
// import { CommonModule } from '@angular/common';
import { WeatherService } from '../services/weather.service';
import { FormBuilder, FormGroup, Validators,FormArray,FormControl } from '@angular/forms';
import { UserPreferencesService } from '../services/user-preferences.service';
import { ActivatedRoute } from '@angular/router';
import { catchError, concatMap, toArray } from 'rxjs/operators';
import { Subscription, Observable, interval, EMPTY, from } from 'rxjs';
@Component({
  selector: 'app-weather-dashboard',
  templateUrl: './weather-dashboard.component.html',
  styleUrls: ['./weather-dashboard.component.css'],
})
export class WeatherDashboardComponent
  implements OnInit, OnDestroy, DoCheck, AfterViewInit
{
  preferencesForm!: FormGroup;
  defaultLocation: string = 'Hyderabad'; // Initialize with a default value
  weatherDetails: {
    location: string;
    temperature: string;
    otherDetails: any;
  }[] = [];
  updateIntervalSubscription: Subscription | undefined = undefined;
  constructor(
    private formBuilder: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private userPreferencesService: UserPreferencesService,
    private weatherService: WeatherService
  ) {}
  // weather-dashboard.component.ts
  getTemperatureForLocation(location: string): string {
    // Find the weather data for the specified location
    console.log(location,'inside getTemperatureLocation')
    console.log(this.weatherDetails,'inside getTemperatureForL')
    const weatherData = this.weatherDetails.find(
      (item) => item.location === location
    );

    if (
      weatherData &&
      weatherData.otherDetails &&
      weatherData.otherDetails.main &&
      weatherData.otherDetails.main.temp
    ) {
      // Assuming temperature is in Kelvin; you might need to convert it to Celsius or Fahrenheit
      const temperatureInKelvin = weatherData.otherDetails.main.temp;
      return `${Math.round(temperatureInKelvin - 273.15)}°C`; // Convert to Celsius
    } else {
      return 'Temperature not available';
    }
  }

  ngOnInit(): void {
    this.initForm();
    console.log(this.preferencesForm.value,'inside ngOnit');
    this.fetchWeatherData(); // Initial fetch

    // Fetch weather data based on the specified update interval
    this.updateIntervalSubscription = interval(
      this.preferencesForm.value.updateInterval * 60 * 1000
    ).subscribe(() => {
      this.fetchWeatherData();
    });
  }
  private handleApiError(location: string, error: any): void {
    console.error(`Error fetching weather data for ${location}:`, error);
    // You can add user-friendly error handling here
  }

  // weather-dashboard.component.ts
  fetchWeatherData(): void {
    console.log("fetchWeatherData is invoked")
    const locations = this.preferencesForm.value.locations;
    console.log(locations, 'inside fetchWeatherData');
  
    if (locations.length === 0) {
      const defaultLocation =
        this.preferencesForm.value.defaultLocation || 'Hyderabad';
      this.weatherService
        .getWeatherDetails(defaultLocation)
        .subscribe((data: any) => {
          console.log(data[0].lat, 'is data');
          const { lat, lon } = data[0];
          console.log(lat, lon);
          this.fetchTemperatureForLocation(lat, lon, defaultLocation);
        });
    } else {
      locations.forEach((location:string) => {
        this.weatherService
          .getWeatherDetails(location)
          .subscribe((data: any) => {
            console.log(data,'inside subscribe that comes after weatherservice call')
            const { lat, lon } = data[0];
            this.fetchTemperatureForLocation(lat, lon, location);
          });
      });
    }
  }
  

  fetchTemperatureForLocation(
    lat: number,
    lon: number,
    location: string
  ): void {
    this.weatherService
      .getTemperature(lat, lon)
      .subscribe((temperatureData: any) => {
        this.displayWeatherData(location, temperatureData);
      });
  }

  displayWeatherData(location: string, data: any): void {
    const weatherDetails = this.weatherDetails || [];
    const index = weatherDetails.findIndex(
      (item) => item.location === location
    );
    console.log(data, 'is data');
    // Fetch the user's temperature unit preference
    const temperatureUnit =
      this.userPreferencesService.getPreferences()?.temperatureUnit ||
      'celsius';

    // Extract the temperature based on the unit preference
    const temperature = this.extractTemperature(data, temperatureUnit);

    if (index !== -1) {
      this.weatherDetails[index] = {
        location,
        temperature,
        otherDetails: data,
      };
    } else {
      this.weatherDetails.push({ location, temperature, otherDetails: data });
    }
  }
  initForm(): void {
    // Existing code
    this.preferencesForm = this.formBuilder.group({
      defaultLocation: ['', Validators.required],
      temperatureUnit: ['Celsius', Validators.required],
      updateInterval: [30, Validators.required], // Default update interval is set to 30 minutes
      newLocation: '', // New input for adding locations
      locations: this.formBuilder.array([]),
    });
    console.log(this.preferencesForm.value,'is preference value of array');

    const savedPreferences = this.userPreferencesService.getPreferences();
    if (savedPreferences) {
      this.preferencesForm.patchValue(savedPreferences);
    }
  }

  savePreferences(): void {
    console.log('Save Preferences button clicked!');
    if (this.preferencesForm.valid) {
      console.log('yes');
      this.preferencesForm.value.locations = Array.from(
        new Set(this.preferencesForm.value.locations)
      );
      this.userPreferencesService.savePreferences(this.preferencesForm.value);
    }
  }

  // weather-dashboard.component.ts

  extractTemperature(data: any, unit: string): string {
    // Implement logic to extract temperature based on the unit preference
    const temperature = data?.main?.temp;

    if (temperature !== undefined) {
      if (unit === 'fahrenheit') {
        // Convert temperature to Fahrenheit if the unit is Fahrenheit
        return this.convertToFahrenheit(temperature).toFixed(2) + '°F';
      } else {
        // Display temperature in Celsius by default
        return temperature.toFixed(2) + '°C';
      }
    } else {
      return 'Temperature not available';
    }
  }

  convertToFahrenheit(celsius: number): number {
    // Conversion formula from Celsius to Fahrenheit
    return (celsius * 9) / 5 + 32;
  }

  addNewLocation(): void {
    console.log('Add Location button clicked!');
    const newLocation = this.preferencesForm.get('newLocation')?.value;
  
    if (newLocation && !this.preferencesForm.value.locations.includes(newLocation)) {
      // Add the new location directly to the form array
      (this.preferencesForm.get('locations') as FormArray).push(new FormControl(newLocation));
  
      // Clear the newLocation input after adding it
      this.preferencesForm.get('newLocation')?.setValue('');
  
      // Trigger fetch for the new location
      this.fetchWeatherData();
    }
  }
  
  

  ngDoCheck(): void {
    // Implement code to monitor changes in the data source and update weather data when changes are detected.
  }

  ngAfterViewInit(): void {
    // Implement code to start rendering the weather data and displaying it in the component.
  }

  ngOnDestroy(): void {
    if (this.updateIntervalSubscription) {
      this.updateIntervalSubscription.unsubscribe();
    }
  }
}
