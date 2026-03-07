import { Injectable } from '@angular/core';
import { Observable, Subject, timer, EMPTY } from 'rxjs';
import { switchMap, retryWhen, tap, delayWhen } from 'rxjs/operators';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { AuthService } from './auth.service';
import { WebSocketMessage, Event } from '../models/interfaces';
import { environment } from '../environment';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket$: WebSocketSubject<WebSocketMessage> | null = null;
  private eventsSubject = new Subject<Event>();
  private connectionStatus = new Subject<boolean>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  readonly events$ = this.eventsSubject.asObservable();
  readonly connectionStatus$ = this.connectionStatus.asObservable();

  constructor(private authService: AuthService) {}

  connect(projectId: string): void {
    this.disconnect();

    const token = this.authService.getToken();
    const wsUrl = `${environment.wsUrl}/ws/events/${projectId}?token=${token}`;

    this.socket$ = webSocket<WebSocketMessage>({
      url: wsUrl,
      openObserver: {
        next: () => {
          this.reconnectAttempts = 0;
          this.connectionStatus.next(true);
        }
      },
      closeObserver: {
        next: () => {
          this.connectionStatus.next(false);
          this.reconnect(projectId);
        }
      }
    });

    this.socket$.subscribe({
      next: (message) => {
        if (message.type === 'event') {
          this.eventsSubject.next(message.data);
        }
      },
      error: () => {
        this.connectionStatus.next(false);
        this.reconnect(projectId);
      }
    });
  }

  disconnect(): void {
    if (this.socket$) {
      this.socket$.complete();
      this.socket$ = null;
    }
    this.connectionStatus.next(false);
    this.reconnectAttempts = 0;
  }

  private reconnect(projectId: string): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      timer(delay).subscribe(() => this.connect(projectId));
    }
  }
}
