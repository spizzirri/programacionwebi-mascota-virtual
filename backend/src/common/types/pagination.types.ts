export interface PaginationQuery {
    page?: number;
    limit?: number;
}

export interface PaginatedResult<T> {
    data: T[];
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}

export function paginate<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
): PaginatedResult<T> {
    const totalPages = Math.ceil(total / limit);
    return {
        data,
        meta: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        },
    };
}
