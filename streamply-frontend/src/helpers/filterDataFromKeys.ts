export function filterDataFromKeys<T>(data: T[], fieldsToFilter: (keyof T)[], filter: string): T[] {
    return data.filter((item) =>
      fieldsToFilter.some((field) => String(item[field]).toLowerCase().includes(filter.toLowerCase()))
    )
  }