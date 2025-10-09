// 測試 Gemini AI Code Review 功能

/**
 * 計算兩個數字的和
 * @param {number} a - 第一個數字
 * @param {number} b - 第二個數字
 * @returns {number} 總和
 */
function add(a, b) {
  return a + b;
}

/**
 * 計算陣列的平均值
 * @param {number[]} numbers - 數字陣列
 * @returns {number} 平均值
 */
function calculateAverage(numbers) {
  // 潛在問題：沒有檢查空陣列
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  return sum / numbers.length;  // 如果 numbers.length === 0 會返回 NaN
}

/**
 * 檢查是否為有效的電子郵件
 * @param {string} email - 電子郵件地址
 * @returns {boolean} 是否有效
 */
function isValidEmail(email) {
  // 這個正則表達式太簡單，無法正確驗證所有情況
  const regex = /^.+@.+\..+$/;
  return regex.test(email);
}

/**
 * 從 API 獲取用戶資料
 * @param {string} userId - 用戶 ID
 * @returns {Promise<Object>} 用戶資料
 */
async function fetchUserData(userId) {
  // 缺少錯誤處理
  const response = await fetch(`https://api.example.com/users/${userId}`);
  const data = await response.json();
  return data;
}

/**
 * 處理用戶登入
 * @param {string} username - 用戶名
 * @param {string} password - 密碼
 * @returns {boolean} 登入是否成功
 */
function login(username, password) {
  // 安全問題：密碼應該加密，不應該明文處理
  // 缺少輸入驗證
  const storedPassword = localStorage.getItem(username);
  return password === storedPassword;
}

module.exports = {
  add,
  calculateAverage,
  isValidEmail,
  fetchUserData,
  login
};
