import { Order } from '../types';

export interface CourierConfig {
  provider: 'steadfast' | 'pathao' | 'redx' | 'mock';
  apiKey: string;
  secretKey?: string;
}

export interface CourierResponse {
  success: boolean;
  trackingId?: string;
  message: string;
}

class CourierService {
  private config: CourierConfig | null = null;

  setConfiguration(config: CourierConfig) {
    this.config = config;
  }

  async sendOrder(order: Order): Promise<CourierResponse> {
    if (!this.config) {
      return { success: false, message: "Courier not configured" };
    }

    console.log(`Sending order ${order.id} to ${this.config.provider}...`);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock response
    return {
      success: true,
      trackingId: `TRK-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      message: "Order successfully sent to courier"
    };
  }

  async getTrackingStatus(trackingId: string): Promise<string> {
    // Simulate API call to get real-time status
    const statuses = ['Pending', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }
}

export const courierService = new CourierService();
