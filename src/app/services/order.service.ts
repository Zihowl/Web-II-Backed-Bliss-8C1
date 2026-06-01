import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OrderItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  price: number;
  subtotal: number;
  description?: string;
}

export interface OrderCustomer {
  name: string;
  phone: string;
  address: string;
  note?: string;
  deliveryType?: string;
  paymentType?: string;
}

export interface SaveOrderPayload {
  order_data: OrderItem[];
  customer?: OrderCustomer;
  paypal_txn_id?: string;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private base: string;
  private apiRoot: string;

  constructor(private http: HttpClient) {
    let root = '/api';
    try {
      const host = (window as any).location.hostname;
      if (host === 'localhost' || host === '127.0.0.1') {
        root = 'http://localhost:3000/api';
      }
    } catch (e) {
      root = '/api';
    }
    this.apiRoot = root;
    this.base = `${root}/user`;
  }

  saveOrder(payload: SaveOrderPayload): Observable<any> {
    return this.http.post<any>(`${this.base}/history`, payload);
  }

  // RF-26/RNF-19: stream SSE del estado de un pedido. El token va por query string
  // porque EventSource no permite cabeceras de autorizacion.
  streamStatus(orderId: number, token: string): EventSource {
    return new EventSource(`${this.apiRoot}/orders/${orderId}/stream?token=${token}`);
  }
}
