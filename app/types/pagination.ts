export type PaginationQuery = {
  page?: number;
  perPage?: number;
  sort?: string;
};

export type PaginatedResponse<T> = {
  data: Array<T>;
  meta: {
    page: number;
    perPage: number;
    total: number;
    lastPage: number;
  };
};
