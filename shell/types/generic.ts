export type ValueOf<T> = T[keyof T]
export type Enumerable<T extends Object> = T['propertyIsEnumerable']
