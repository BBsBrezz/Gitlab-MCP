// 測試 AI Code Review 功能

/**
 * 計算兩個數字的總和
 * @param {number} a - 第一個數字
 * @param {number} b - 第二個數字
 * @returns {number} 總和
 */
function add(a, b) {
  return a + b;
}

/**
 * 計算陣列中所有數字的平均值
 * @param {number[]} numbers - 數字陣列
 * @returns {number} 平均值
 */
function average(numbers) {
  // 這裡有個潛在的 bug：沒有檢查空陣列
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  return sum / numbers.length;
}

/**
 * 驗證電子郵件格式
 * @param {string} email - 電子郵件地址
 * @returns {boolean} 是否有效
 */
function validateEmail(email) {
  // 這個正則表達式太簡單，無法涵蓋所有情況
  const regex = /^.+@.+\..+$/;
  return regex.test(email);
}

module.exports = {
  add,
  average,
  validateEmail
};
