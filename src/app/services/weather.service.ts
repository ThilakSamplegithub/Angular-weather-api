import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private apiUrl = 'http://api.openweathermap.org/geo/1.0/direct';

  constructor(private http: HttpClient) {}

  getWeatherDetails(city: string): Observable<any> {
    const url = `${this.apiUrl}?q=${city}&appid=${environment.apiKey}`;
    console.log(url,"is url")
    return this.http.get<any>(url);
  }
  getTemperature(lat: number, lon: number): Observable<any> {
    console.log(lat,lon,'in weather service')
    const url=`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${environment.apiKey}`
    console.log(url,'is url with lat and long')
    return this.http.get(url);
  }
}
