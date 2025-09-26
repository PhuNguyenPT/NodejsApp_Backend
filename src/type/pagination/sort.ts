import { Expose, Type } from "class-transformer";

export type SortDirection = "ASC" | "DESC";

/**
 * Represents a single sort criterion (property and direction).
 */
export class Order {
    @Expose()
    public readonly direction: SortDirection;
    @Expose()
    public readonly field: string;

    constructor(field: string, direction: SortDirection = "ASC") {
        this.field = field;
        this.direction = direction;
    }

    /**
     * Returns a new Order with ascending direction.
     */
    public ascending(): Order {
        return new Order(this.field, "ASC");
    }

    /**
     * Returns a new Order with descending direction.
     */
    public descending(): Order {
        return new Order(this.field, "DESC");
    }
}

/**
 * Manages a collection of Order objects for defining sort criteria.
 */
export class Sort {
    @Expose()
    @Type(() => Order)
    public readonly orders: Order[];

    private constructor(orders: Order[]) {
        this.orders = orders;
    }

    /**
     * Creates a new Sort instance for the given fields with default ascending order.
     */
    public static by(...fields: string[]): Sort;
    public static by(...orders: Order[]): Sort;
    public static by(...args: (Order | string)[]): Sort {
        const orders = args.map((arg) =>
            typeof arg === "string" ? new Order(arg, "ASC") : arg,
        );
        return new Sort(orders);
    }

    /**
     * Returns an unsorted Sort instance.
     */
    public static unsorted(): Sort {
        return new Sort([]);
    }

    /**
     * Combines the current Sort object with another one.
     */
    public and(sort: Sort): Sort {
        const combinedOrders = [...this.orders, ...sort.orders];
        return new Sort(combinedOrders);
    }

    /**
     * Returns a new Sort object with all its orders set to ascending.
     */
    public ascending(): Sort {
        const newOrders = this.orders.map((order) => order.ascending());
        return new Sort(newOrders);
    }

    /**
     * Returns a new Sort object with all its orders set to descending.
     */
    public descending(): Sort {
        const newOrders = this.orders.map((order) => order.descending());
        return new Sort(newOrders);
    }

    /**
     * Get the order for a specific property.
     */
    public getOrderFor(property: string): null | Order {
        return this.orders.find((order) => order.field === property) ?? null;
    }

    /**
     * Returns true if sorting is applied.
     */
    public isSorted(): boolean {
        return !this.isUnsorted();
    }

    /**
     * Returns true if no sorting is applied.
     */
    public isUnsorted(): boolean {
        return this.orders.length === 0;
    }

    /**
     * Converts the Sort object to a format compatible with TypeORM's FindManyOptions.
     */
    public toTypeOrmOrder(): Record<string, "ASC" | "DESC"> {
        const order: Record<string, "ASC" | "DESC"> = {};
        this.orders.forEach((o) => {
            order[o.field] = o.direction;
        });
        return order;
    }
}
