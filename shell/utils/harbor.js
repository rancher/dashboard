export function captureVersion(str) {
  const reg = /[0-9]+(\.[0-9]+)+/;
  const versionMat = str.match(reg);

  if (!versionMat) {
    return versionMat;
  }
  const [version] = versionMat;

  return [version, str];
}

export function tagsSortingInit(arrTag) {
  const versions = [];
  let result = [];
  const noVersion = [];

  arrTag.forEach((item) => {
    const version = captureVersion(item);

    if (version) {
      versions.push(version);
    } else {
      noVersion.push(item);
    }
  });
  versions.sort(versionSort.bind(this)).forEach((item) => {
    result.push(item[1]);
  });
  result = result.concat(noVersion.sort(normalSort.bind(this)));
  result = result.sort(markSort.bind(this));

  return result;
}
export function tagsResultFormat(arr) {
  const list = [];

  arr.forEach((item) => {
    list.push({ name: item });
  });

  return list;
}

export function versionSort(ver2, ver1) {
  if (ver1[0] === ver2[0]) {
    return normalSort(ver2[1], ver1[1]);
  }
  const arr1 = ver1[0].split('.');
  const arr2 = ver2[0].split('.');
  const minLen = Math.min(arr1.length, arr2.length);

  for (let i = 0; i < minLen; i++) {
    if (parseInt(arr1[i], 10) > parseInt(arr2[i], 10)) {
      return 1;
    } else if (parseInt(arr1[i], 10) < parseInt(arr2[i], 10)) {
      return -1;
    }
    if (i + 1 === minLen) {
      if (arr1.length > arr2.length) {
        return 1;
      } else if (arr1.length < arr2.length) {
        return -1;
      }
    }
  }
}

export function normalSort(str2, str1) {
  return str2.localeCompare(str1);
}

export function markSort(data2, data1) {
  const mark1 = captureMark(data1);
  const mark2 = captureMark(data2);

  if (!mark1 || !mark2 || mark2[2] !== mark1[2]) {
    return 0;
  }
  if (parseInt(mark1[0], 10) > parseInt(mark2[0], 10)) {
    return 1;
  } else if (parseInt(mark1[0], 10) < parseInt(mark2[0], 10)) {
    return -1;
  } else {
    return 0;
  }
}

export function captureMark(str) {
  const nReg = /(.*)[_|-]([0-9]+)$/;
  const markMat = str.match(nReg);

  if (!markMat) {
    return markMat;
  }
  const [, prefix, mark] = markMat;

  return [mark, str, prefix];
}

export default { tagsSortingInit, tagsResultFormat };
