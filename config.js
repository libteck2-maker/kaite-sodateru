// 「書く筋肉」製品版 v1 設定
// Supabaseを使う場合は下の2つを自分のプロジェクトの値にする。空のままだとデモモード（この端末のlocalStorage）で動く。
window.KK_CONFIG = {
  APP_NAME: "書く筋肉",
  SUPABASE_URL: "https://tftdiytonolvqrygmghm.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmdGRpeXRvbm9sdnFyeWdtZ2htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ2NDI3MTcsImV4cCI6MjExMDIxODcxN30.-dmP1D7iqyclrIwOE38-9FAHzau0nricWI-fj752cdk",
  // 成長パラメータ（アップデートで調整可能。過去月の図鑑は凍結されるので変わらない）
  MONTH_FULL_INK: 3500000, // 月の総インクがこれで満ちる
  DAY_FULL_INK: 300000,    // 1日のインクの満点（その日の跳ね）
  MONTH_WEIGHT: 0.8,
  DAY_WEIGHT: 0.2,
  KG_DIVISOR: 25000        // kg級 = 月の総インク / これ
};
