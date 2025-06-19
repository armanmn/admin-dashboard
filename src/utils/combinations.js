export function combinations(arr, maxLen) {
  const result = [];

  const helper = (start, combo) => {
    if (combo.length > 0 && combo.length <= maxLen) {
      result.push([...combo]);
    }
    if (combo.length === maxLen) return;

    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i]);
      helper(i + 1, combo);
      combo.pop();
    }
  };

  helper(0, []);
  return result;
}