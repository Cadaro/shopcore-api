import { PaginatedResponse } from '#types/pagination';

export default class PaginationDataMapper {
  map<T>(data: Array<T>, page: number, perPage: number, total: number): PaginatedResponse<T> {
    return {
      data,
      meta: {
        page,
        perPage,
        total,
        lastPage: Math.ceil(total / perPage),
      },
    };
  }
}
