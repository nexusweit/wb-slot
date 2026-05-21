export default function handler(req, res) {
  // Берем ссылку из переменной REDIRECT_URL или шлем на google, если забыли настроить
  const target = process.env.REDIRECT_URL || 'https://google.com';
  
  // Выполняем редирект (307 - временный, чтобы браузер не кэшировал его навсегда)
  res.redirect(307, target);
}