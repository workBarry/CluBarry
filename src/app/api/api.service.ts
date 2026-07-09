import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL, endpoints } from './endpoints';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private readonly http: HttpClient) {}

  private url(path: string): string {
    return `${API_BASE_URL}${path}`;
  }

  get<T>(path: string, params?: Record<string, string | number>): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return this.http.get<T>(this.url(path), { params: httpParams });
  }

  post<T>(path: string, body: unknown): Observable<T> {
    return this.http.post<T>(this.url(path), body);
  }

  put<T>(path: string, body: unknown): Observable<T> {
    return this.http.put<T>(this.url(path), body);
  }

  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(this.url(path));
  }

  get auth() {
    return {
      login: (data: { email: string; password: string }) => this.post<unknown>(endpoints.auth.login, data),
      register: (data: unknown) => this.post<unknown>(endpoints.auth.register, data),
      me: () => this.get<unknown>(endpoints.auth.me),
    };
  }

  get events() {
    return {
      list: () => this.get<unknown[]>(endpoints.events),
      byId: (id: number) => this.get<unknown>(`${endpoints.events}/${id}`),
    };
  }

  get announcements() {
    return {
      list: () => this.get<unknown[]>(endpoints.announcements),
      byId: (id: number) => this.get<unknown>(`${endpoints.announcements}/${id}`),
    };
  }

  get registrations() {
    return {
      list: () => this.get<unknown[]>(endpoints.registrations),
      create: (data: unknown) => this.post<unknown>(endpoints.registrations, data),
      cancel: (id: number) => this.delete<unknown>(`${endpoints.registrations}/${id}`),
    };
  }
}
