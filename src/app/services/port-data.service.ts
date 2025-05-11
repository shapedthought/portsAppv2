import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  ProductsResponse,
  PortDataResponse,
  TargetServicesResponse,
  SourceServicesResponse,
} from '../models/responses';
import { PortRequest, SourceRequest, TargetRequest } from '../models/requests';

@Injectable({
  providedIn: 'root',
})
export class PortDataService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Gets all port data from the API
   * @returns Observable of PortData array
   */
  getAllProducts(): Observable<ProductsResponse[]> {
    return this.http.get<ProductsResponse[]>(`${this.baseUrl}/`).pipe(
      retry(2), // Retry failed requests up to 2 times
      catchError(this.handleError)
    );
  }
  getSources(
    sourceRequest: SourceRequest
  ): Observable<SourceServicesResponse[]> {
    return this.http
      .post<SourceServicesResponse[]>(`${this.baseUrl}/source`, sourceRequest)
      .pipe(
        retry(1), // Retry failed request once
        catchError(this.handleError)
      );
  }

  /**
   * Gets port data for specific target products based on the request
   * @param targetRequest The request containing target products to filter by
   * @returns Observable of PortData array
   */
  getPorts(targetRequest: PortRequest): Observable<PortDataResponse[]> {
    return this.http
      .post<PortDataResponse[]>(`${this.baseUrl}/allPorts`, targetRequest)
      .pipe(
        retry(1), // Retry failed request once
        catchError(this.handleError)
      );
  }

  /**
   * Error handler for HTTP requests
   * @param error The HTTP error response
   * @returns Observable with error message
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = '';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
