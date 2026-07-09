import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { Club, ClubMember } from '../types/club.models';

export interface CreateClubRequest {
  club: Omit<Club, 'id'>;
  presidentId: string;
}

export interface CreateClubResponse {
  clubId: string;
  memberId: string;
}

export interface MyClubResponse {
  club: Club;
  role: ClubMember['roleInClub'];
}

@Injectable({ providedIn: 'root' })
export class ClubApiClientService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/clubs`;

  createClub(request: CreateClubRequest): Observable<CreateClubResponse> {
    return this.http.post<CreateClubResponse>(this.baseUrl, request);
  }

  getMyClubs(): Observable<MyClubResponse[]> {
    return this.http.get<MyClubResponse[]>(`${this.baseUrl}/mine`);
  }

  getMyRoleInClub(clubId: string): Observable<ClubMember['roleInClub'] | null> {
    return this.http.get<ClubMember['roleInClub'] | null>(`${this.baseUrl}/${clubId}/my-role`);
  }
}