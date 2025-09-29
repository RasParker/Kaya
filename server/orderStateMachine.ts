import { Order } from "@shared/schema";

// Define valid order statuses
export const OrderStatus = {
  PENDING: 'pending',
  SELLER_CONFIRMED: 'seller_confirmed', 
  KAYAYO_ACCEPTED: 'kayayo_accepted',
  SHOPPING: 'shopping',
  READY_FOR_PICKUP: 'ready_for_pickup',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
} as const;

export type OrderStatusType = typeof OrderStatus[keyof typeof OrderStatus];

// Define valid state transitions
const VALID_TRANSITIONS: Record<OrderStatusType, OrderStatusType[]> = {
  [OrderStatus.PENDING]: [OrderStatus.SELLER_CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.SELLER_CONFIRMED]: [OrderStatus.KAYAYO_ACCEPTED, OrderStatus.CANCELLED],
  [OrderStatus.KAYAYO_ACCEPTED]: [OrderStatus.SHOPPING, OrderStatus.CANCELLED],
  [OrderStatus.SHOPPING]: [OrderStatus.READY_FOR_PICKUP, OrderStatus.CANCELLED],
  [OrderStatus.READY_FOR_PICKUP]: [OrderStatus.IN_TRANSIT, OrderStatus.CANCELLED],
  [OrderStatus.IN_TRANSIT]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [], // Terminal state
  [OrderStatus.CANCELLED]: [] // Terminal state
};

// Define who can trigger each transition
const TRANSITION_PERMISSIONS: Record<string, { from: OrderStatusType; to: OrderStatusType; role: string }[]> = {
  'seller': [
    { from: OrderStatus.PENDING, to: OrderStatus.SELLER_CONFIRMED, role: 'seller' }
  ],
  'kayayo': [
    { from: OrderStatus.SELLER_CONFIRMED, to: OrderStatus.KAYAYO_ACCEPTED, role: 'kayayo' },
    { from: OrderStatus.KAYAYO_ACCEPTED, to: OrderStatus.SHOPPING, role: 'kayayo' },
    { from: OrderStatus.SHOPPING, to: OrderStatus.READY_FOR_PICKUP, role: 'kayayo' }
  ],
  'rider': [
    { from: OrderStatus.READY_FOR_PICKUP, to: OrderStatus.IN_TRANSIT, role: 'rider' },
    { from: OrderStatus.IN_TRANSIT, to: OrderStatus.DELIVERED, role: 'rider' }
  ],
  'buyer': [
    // Buyers can cancel orders in certain states
    { from: OrderStatus.PENDING, to: OrderStatus.CANCELLED, role: 'buyer' },
    { from: OrderStatus.SELLER_CONFIRMED, to: OrderStatus.CANCELLED, role: 'buyer' }
  ]
};

export class OrderStateError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'OrderStateError';
  }
}

export class OrderStateMachine {
  /**
   * Check if a status transition is valid
   */
  static isValidTransition(fromStatus: string, toStatus: string): boolean {
    const validNextStates = VALID_TRANSITIONS[fromStatus as OrderStatusType];
    return validNextStates ? validNextStates.includes(toStatus as OrderStatusType) : false;
  }

  /**
   * Check if a user role can perform a specific transition
   */
  static canPerformTransition(
    fromStatus: string, 
    toStatus: string, 
    userRole: string,
    order: Order,
    userId: string
  ): boolean {
    // Check if transition is valid first
    if (!this.isValidTransition(fromStatus, toStatus)) {
      return false;
    }

    // Check role permissions
    const roleTransitions = TRANSITION_PERMISSIONS[userRole] || [];
    const hasPermission = roleTransitions.some(
      t => t.from === fromStatus && t.to === toStatus
    );

    if (!hasPermission) {
      return false;
    }

    // Additional ownership checks
    switch (userRole) {
      case 'buyer':
        return order.buyerId === userId;
      case 'kayayo':
        // For initial acceptance, allow when order is not yet assigned
        if (toStatus === OrderStatus.KAYAYO_ACCEPTED) {
          return !order.kayayoId; // Allow if no kayayo assigned yet
        }
        // For other transitions, kayayo must be assigned to this user
        return order.kayayoId === userId;
      case 'rider':
        // For initial pickup, allow when order is not yet assigned to a rider
        if (toStatus === OrderStatus.IN_TRANSIT) {
          return !order.riderId; // Allow if no rider assigned yet
        }
        // For other transitions, rider must be assigned to this user
        return order.riderId === userId;
      default:
        return true; // Sellers don't need ownership checks for their confirmations
    }
  }

  /**
   * Validate and perform a status transition
   */
  static validateTransition(
    order: Order,
    newStatus: string,
    userRole: string,
    userId: string
  ): void {
    const currentStatus = order.status;

    // Check if transition is valid
    if (!this.isValidTransition(currentStatus, newStatus)) {
      throw new OrderStateError(
        `Invalid transition from ${currentStatus} to ${newStatus}`,
        'INVALID_TRANSITION'
      );
    }

    // Check if user can perform this transition
    if (!this.canPerformTransition(currentStatus, newStatus, userRole, order, userId)) {
      throw new OrderStateError(
        `User role ${userRole} cannot transition order from ${currentStatus} to ${newStatus}`,
        'UNAUTHORIZED_TRANSITION'
      );
    }
  }

  /**
   * Get next valid statuses for an order
   */
  static getNextValidStatuses(currentStatus: string): OrderStatusType[] {
    return VALID_TRANSITIONS[currentStatus as OrderStatusType] || [];
  }

  /**
   * Get status display name for UI
   */
  static getStatusDisplayName(status: string): string {
    const displayNames: Record<string, string> = {
      [OrderStatus.PENDING]: 'Pending Confirmation',
      [OrderStatus.SELLER_CONFIRMED]: 'Confirmed by Seller',
      [OrderStatus.KAYAYO_ACCEPTED]: 'Kayayo Assigned',
      [OrderStatus.SHOPPING]: 'Shopping in Progress',
      [OrderStatus.READY_FOR_PICKUP]: 'Ready for Pickup',
      [OrderStatus.IN_TRANSIT]: 'Out for Delivery',
      [OrderStatus.DELIVERED]: 'Delivered',
      [OrderStatus.CANCELLED]: 'Cancelled'
    };
    return displayNames[status] || status;
  }

  /**
   * Get status description for UI
   */
  static getStatusDescription(status: string): string {
    const descriptions: Record<string, string> = {
      [OrderStatus.PENDING]: 'Waiting for seller to confirm order items',
      [OrderStatus.SELLER_CONFIRMED]: 'All items confirmed, waiting for kayayo assignment',
      [OrderStatus.KAYAYO_ACCEPTED]: 'Kayayo assigned, preparing to shop',
      [OrderStatus.SHOPPING]: 'Kayayo is shopping for your items',
      [OrderStatus.READY_FOR_PICKUP]: 'Items ready, waiting for rider pickup',
      [OrderStatus.IN_TRANSIT]: 'Order is on the way to you',
      [OrderStatus.DELIVERED]: 'Order has been delivered successfully',
      [OrderStatus.CANCELLED]: 'Order has been cancelled'
    };
    return descriptions[status] || 'Unknown status';
  }

  /**
   * Check if status is terminal (no further transitions possible)
   */
  static isTerminalStatus(status: string): boolean {
    return status === OrderStatus.DELIVERED || status === OrderStatus.CANCELLED;
  }

  /**
   * Get actions available for a user on an order
   */
  static getAvailableActions(
    order: Order, 
    userRole: string, 
    userId: string
  ): { status: OrderStatusType; action: string; description: string }[] {
    const actions: { status: OrderStatusType; action: string; description: string }[] = [];
    const currentStatus = order.status;

    // Get all possible next statuses
    const nextStatuses = this.getNextValidStatuses(currentStatus);

    for (const nextStatus of nextStatuses) {
      if (this.canPerformTransition(currentStatus, nextStatus, userRole, order, userId)) {
        let action = '';
        let description = '';

        switch (nextStatus) {
          case OrderStatus.SELLER_CONFIRMED:
            action = 'confirm';
            description = 'Confirm all order items';
            break;
          case OrderStatus.KAYAYO_ACCEPTED:
            action = 'accept';
            description = 'Accept this order';
            break;
          case OrderStatus.SHOPPING:
            action = 'start_shopping';
            description = 'Start shopping for items';
            break;
          case OrderStatus.READY_FOR_PICKUP:
            action = 'ready_for_pickup';
            description = 'Mark order as ready for pickup';
            break;
          case OrderStatus.IN_TRANSIT:
            action = 'pickup';
            description = 'Pick up and start delivery';
            break;
          case OrderStatus.DELIVERED:
            action = 'deliver';
            description = 'Mark as delivered';
            break;
          case OrderStatus.CANCELLED:
            action = 'cancel';
            description = 'Cancel this order';
            break;
        }

        if (action) {
          actions.push({ status: nextStatus, action, description });
        }
      }
    }

    return actions;
  }
}