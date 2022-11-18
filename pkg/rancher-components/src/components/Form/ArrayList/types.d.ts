export type ArrayListRow = {
    value: string;
}

export type ArrayListData = {
    lastUpdateWasFromValue: boolean;
    rows: Array<ArrayListRow>,
}