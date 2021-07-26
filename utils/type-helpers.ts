
export default { memberOfObject: <V = string>(obj: {[key: string]: any}, key: string) => Object.entries(obj).find(([k]) => k === key) as unknown as V };
