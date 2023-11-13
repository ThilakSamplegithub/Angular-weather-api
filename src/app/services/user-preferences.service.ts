import { Injectable } from '@angular/core';
export interface UserPreferences {
  defaultLocation: string;
  temperatureUnit: 'Celsius' | 'Fahrenheit';
  updateInterval: number;
  locations: string[]; // Array to store multiple locations
}
@Injectable({
  providedIn: 'root'
})
export class UserPreferencesService {

  savePreferences(preferences: UserPreferences): void {
    // Implement code to save user preferences.
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
  }

  getPreferences(): UserPreferences {
    // Implement code to retrieve user preferences.
    const preferencesString = localStorage.getItem('userPreferences');
    return preferencesString ? JSON.parse(preferencesString) : null;
  }
  addLocation(location: string): void {
    const preferences = this.getPreferences();
    if (preferences) {
      preferences.locations.push(location);
      this.savePreferences(preferences);
    }
  }

  removeLocation(location: string): void {
    const preferences = this.getPreferences();
    if (preferences) {
      preferences.locations = preferences.locations.filter((loc:string) => loc !== location);
      this.savePreferences(preferences);
    }
  }
  getLocations(): string[] {
    const preferences = this.getPreferences();
    return preferences?.locations || [];
  }
}
